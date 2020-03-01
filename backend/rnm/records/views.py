import os
import json
import numpy as np
import datetime
import traceback

from django.shortcuts import render
from django.middleware.csrf import get_token
from django.http import HttpResponse, JsonResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.utils import timezone

from rest_framework import viewsets, generics, permissions, parsers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import AddRecordSerializer, UpdateRecordSerializer, UpdateGenderSerializer, UploadXlsxBufferSerializer, UploadRecordImageSerializer
from .utils import xlsxToJson, strptime, checkUpdateConflict, checkExistingRecords, findRecord, addEvent, Cleaned, resultByCriteria, resultBySid, checkRequiredFailed
from .models import Record, UploadXlsxBuffer, EventType, Label, RecordEvent, RecordLabel, RecordExp, RecordNetworking
from .constants import *


class ReadXlsxAPI(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        ### delete all expired.
        no_older_than_1day = timezone.now() - timezone.timedelta(days=60)
        r = UploadXlsxBuffer.objects.filter(create_time__lt=no_older_than_1day)
        for _r in r:
            try: os.remove(_r.file.path)
            except: pass
            finally: _r.delete()

        serializer = UploadXlsxBufferSerializer(data=request.data)
        if serializer.is_valid():
            _buffered = serializer.save()
            _hash = _buffered.hash

            event_date = serializer.validated_data.get('event_date')
            event_type = serializer.validated_data.get('event_type')
            if event_date and event_type:
                ################
                ### import event
                ################
                _result, _json = xlsxToJson(_buffered.file.path, add_event=True)
                if _result != "ok":
                    return JsonResponse({"result": "error", "message": _result})
                roster = checkExistingRecords(json.loads(_json), add_event=True)
                _buffered.json = json.dumps({
                    'event_date': event_date,
                    'event_type': event_type,
                    'roster': roster,
                    })
                for r in roster: 
                    if r['phone1'] and len(r['phone1']) == 10:
                        r['phone1'] = "{}-{}-{}".format(r['phone1'][:4], r['phone1'][4:7], r['phone1'][7:])
            else:
                #################
                ### import roster
                #################
                _result, _json = xlsxToJson(_buffered.file.path)
                if _result != "ok":
                    return JsonResponse({"result": "error", "message": _result})
                roster = checkExistingRecords(json.loads(_json))
                _buffered.json = json.dumps({'roster': roster})

                ### parse repr ###
                for r in roster: 
                    if r['phone1'] and len(r['phone1']) == 10:
                        r['phone1'] = "{}-{}-{}".format(r['phone1'][:4], r['phone1'][4:7], r['phone1'][7:])
                    if r['landline'] and len(r['landline']) > 8:
                        r['landline'] = "{}-{}-{}".format(r['landline'][:2], r['landline'][2:5], r['landline'][5:])
                    if r['birthday'] and len(r['birthday']) == 8:
                        r['birthday'] = "{}-{}-{}".format(r['birthday'][:4], r['birthday'][4:6], r['birthday'][6:])

            roster = json.dumps(roster)
            _buffered.save()
            return JsonResponse({'result': 'ok', 'hash': _hash, 'roster': roster, 'id': _buffered.id})
        else:
            print(serializer.errors)
            return JsonResponse({"result": "error", "msg": serializer.errors})


class ConfirmImportAPI(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        if not request.POST.get('hash'):
            return JsonResponse({'result': 'error', 'message': 'no hash'})
        else:
            try: _buffered = UploadXlsxBuffer.objects.get(hash=request.POST.get('hash'))
            except:
                return JsonResponse({'result': 'error', 'message': 'hash not found'})
            else:
                _json = json.loads(_buffered.json)
                event_date = _json.get('event_date')
                event_type = _json.get('event_type')
                len_total = len(_json.get('roster'))
                len_success = 0
                if event_date and event_type:
                    ################
                    ### import event
                    ################
                    for record in _json.get('roster'):
                        if record.get('status') == NEW_RECORD:
                            x = Record(
                                name=record.get('name'),
                                phone1=record.get('phone1'),
                                phone2=record.get('phone2'),
                                created_by=request.user,
                                )
                            x.save()
                            addEvent(x, event_type, event_date)
                        else:
                            record = findRecord(record.get('name'), record.get('phone1'))
                            if len(record) > 0:
                                addEvent(record[0], event_type, event_date)
                        len_success += 1
                else:
                    #################
                    ### import roster
                    #################
                    len_success, _ = checkExistingRecords(_json.get('roster'), request_user=request.user, dry=False)

                return JsonResponse({'result': 'ok', 'message': 'len_total: {}, len_success: {}'.format(len_total, len_success), 'len': {'total': len_total, 'success': len_success}})


class SearchAPI(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        try:
            if len(request.POST.get('sid', '')) > 0:
                ### sid search
                results = resultBySid(request.POST, request.user)
            else:
                ### search criteria
                results = resultByCriteria(request.POST, request.user)
                for each in results:
                    _t = Record.objects.get(id=each["id"])
                    # each["remark"] = True if len(_t.conflict or '') > 0 or _t.introducer_link == _t or checkRequiredFailed(_t) else False
                    each["remark"] = ""
                    if len(_t.conflict or '') > 0:
                        each["remark"] = "conflict"
                    elif _t.introducer_link == _t:
                        each["remark"] = "introducer"
                    elif checkRequiredFailed(_t):
                        each["remark"] = "required"
            request_POST = json.dumps(request.POST, ensure_ascii=False)
            return Response(json.dumps({'roster': list(results), 'criteria': request_POST}, default=str, ensure_ascii=False))
        except:
            traceback.print_exc()
        return Response({'result': 'error'})


class ExportXlsxAPI(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        criteria = json.loads(request.POST.get('criteria'))
        results = resultByCriteria(criteria, request.user)
        import pandas as pd
        import io
        df = pd.DataFrame(list(results))
        df.columns = map(lambda x: x, df.columns)
        _bytesio = io.BytesIO()
        writer = pd.ExcelWriter(_bytesio)
        df.reset_index()
        df.index = df.index + 1
        df = df.drop(columns="id")
        df = df.drop(columns="img")
        df.to_excel(writer, sheet_name='Sheet1')

        workbook = writer.book
        worksheet = writer.sheets['Sheet1']
        writer.save()
        _bytesio.seek(0)
        response = HttpResponse(_bytesio.read(), content_type='applicationn/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename=foo.xlsx'
        return response


class AddRecordAPI(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = AddRecordSerializer
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        serializer = AddRecordSerializer(data=request.data)
        if serializer.is_valid():
            print(serializer.validated_data)
            if serializer.validated_data.get('phone1'):
                record1 = findRecord(serializer.validated_data.get('name'), serializer.validated_data.get('phone1'))
            else:
                record1 = []
            if serializer.validated_data.get('phone2'):
                record2 = findRecord(serializer.validated_data.get('name'), serializer.validated_data.get('phone2'))
            else:
                record2 = []
            if len(record1) + len(record2) == 0:
                record = serializer.save()
                record.created_by = request.user
                record.save()
                ### default introducer is self
                if record.introducer_name == '' and record.introducer_phone == '':
                    record.introducer_name = record.name
                    record.introducer_phone = record.phone1
                    record.introducer_link = record
                record.save()

                ### setup label
                if len(request.data.get('label', '')) > 0:
                    for _es in request.data['label'].split(','):
                        label = RecordLabel(record=record, label=Label.objects.get(id=int(_es)))
                        label.save()
                
                exps = [i.split(",") for i in request.data.getlist('exp')]
                exp_ids = {int(i[0]) for i in exps if len(i[0]) > 0}
                sexps = set(RecordExp.objects.filter(record=record).values_list("id", flat=True))
                # remove exp
                for removed in sexps - exp_ids: 
                    try: RecordExp.objects.get(id=removed).delete()
                    except: 
                        traceback.print_exc()
                # add new exp
                for new_exp in [i for i in exps if len(i[0]) == 0]: 
                    name = new_exp[1]
                    try: year = int(new_exp[2])
                    except: year = None
                    RecordExp(record=record, exp=name, year=year).save()
                # update exps
                for exp in exps:
                    if len(exp[0]) > 0:
                        tid = int(exp[0])
                        name = exp[1]
                        try: year = int(exp[2])
                        except: year = None
                        exp_instance = RecordExp.objects.get(id=tid)
                        exp_instance.exp = name
                        exp_instance.year = year
                        exp_instance.save()

                networkings = [i.split(",") for i in request.data.getlist('networking')]
                networking_ids = {int(i[0]) for i in networkings if len(i[0]) > 0}
                snetworkings = set(RecordNetworking.objects.filter(record=record).values_list("id", flat=True))
                # remove networking
                for removed in snetworkings - networking_ids:
                    try: RecordNetworking.objects.get(id=removed).delete()
                    except: 
                        traceback.print_exc()
                # add new networking
                for new_networking in [i for i in networkings if len(i[0]) == 0]: 
                    name = new_networking[1]
                    phone = new_networking[2]
                    rel = new_networking[3]
                    networking_instance = RecordNetworking(record=record, name=name, phone=phone, relationship=rel)
                    if len(phone or "") > 0:
                        link = findRecord(name=name, phone=phone)
                    else:
                        link = Record.objects.filter(name=name)
                    if len(link) == 1:
                        networking_instance.link = link[0]
                    elif len(link) == 0: 
                        link_record = Record(name=name, phone1=phone, created_by=request.user)
                        link_record.save()
                        networking_instance.link = link_record
                    networking_instance.save()
                # update networking
                for networking in networkings:
                    if len(networking[0]) > 0 and networking[0] != -1:
                        nid   = int(networking[0])
                        name  = networking[1]
                        phone = networking[2]
                        rel   = networking[3]
                        try: networking_instance = RecordNetworking.objects.get(id=nid)
                        except RecordNetworking.DoesNotExist: continue
                        networking_instance.name = name
                        networking_instance.phone = phone
                        networking_instance.relationship = rel
                        if len(phone or "") > 0:
                            link = findRecord(name=name, phone=phone)
                        else:
                            link = Record.objects.filter(name=name)
                        if len(link) == 1:
                            networking_instance.link = link[0]
                        elif len(link) == 0:
                            networking_instance.link = None
                        networking_instance.save()


                # ### setup exp
                # if len(request.data.getlist('exp', '')) > 0:
                #     for _exp in request.data.getlist('exp'):
                #         n, y = _exp.split(",")
                #         if len(y) == 0:
                #             sup_exp =RecordExp(record=record, exp=n)
                #         else:
                #             sup_exp =RecordExp(record=record, exp=n, year=y)
                #         sup_exp.save()

                # ### setup networking
                # if len(request.data.getlist('networking', '')) > 0:
                #     for _networking in request.data.getlist('networking'):
                #         n, p, r, sid = _networking.split(",")
                #         if len(n) + len(p) != 0:
                #             if len(RecordNetworking.objects.filter(record=record, name=n, phone=p)) == 0:
                #                 sup_networking = RecordNetworking(record=record, name=n, phone=p, relationship=r)
                #                 _s = None
                #                 if sid == "-1":
                #                     _s = Record(name=n, phone1=p)
                #                     _s.save()
                #                 elif sid != "":
                #                     try: _s = Record.objects.get(id=int(sid))
                #                     except: print("Didn't find record", sid)
                #             sup_networking.link = _s
                #         sup_networking.save()

                return Response({'result': 'done', 'sid': record.id})
            else:
                return Response({'result': 'error', 'msg': 'duplicate'})

        return Response({'result': 'error', 'msg': ';'.join([str(m[0]) for i, m in serializer.errors.items()])})

class RemoveRecordAPI(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        ### validation
        try:
            s = Record.objects.get(id=int(request.data.get('sid')))
            sn = RecordNetworking.objects.filter(link=s)
            for record in sn:
                record.delete()
            sn = RecordNetworking.objects.filter(record=s)
            for record in sn:
                record.delete()
            st = RecordExp.objects.filter(record=s)
            for record in st:
                record.delete()
            se = RecordEvent.objects.filter(record=s)
            for record in se:
                record.delete()
            sest = RecordLabel.objects.filter(record=s)
            for record in sest:
                record.delete()
            s.delete()
            return Response({'result': 'done'})
        except Exception as e:
            print(e)
            print("sid not found", request.data.get('sid'))
            return Response({'result': 'error'})


class SaveRecordChangesAPI(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_classes = [UpdateRecordSerializer, UpdateGenderSerializer]
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        try: s = Record.objects.get(id=request.data['id'])
        except: return Response({'result': 'error', 'msg': 'id not found.'})
        serializer = UpdateRecordSerializer(s, data=request.data)

        if serializer.is_valid():
            serializer.save()
        else:
            print(serializer.errors)

        exps = [i.split(",") for i in request.data.getlist('exp')]
        exp_ids = {int(i[0]) for i in exps if len(i[0]) > 0}
        sexps = set(RecordExp.objects.filter(record=s).values_list("id", flat=True))
        # remove exp
        for removed in sexps - exp_ids: 
            try: RecordExp.objects.get(id=removed).delete()
            except: 
                traceback.print_exc()
        # add new exp
        for new_exp in [i for i in exps if len(i[0]) == 0]: 
            name = new_exp[1]
            try: year = int(new_exp[2])
            except: year = None
            RecordExp(record=s, exp=name, year=year).save()
        # update exps
        for exp in exps:
            if len(exp[0]) > 0:
                tid = int(exp[0])
                name = exp[1]
                try: year = int(exp[2])
                except: year = None
                exp_instance = RecordExp.objects.get(id=tid)
                exp_instance.exp = name
                exp_instance.year = year
                exp_instance.save()

        networkings = [i.split(",") for i in request.data.getlist('networking')]
        networking_ids = {int(i[0]) for i in networkings if len(i[0]) > 0}
        snetworkings = set(RecordNetworking.objects.filter(record=s).values_list("id", flat=True))
        # remove networking
        for removed in snetworkings - networking_ids:
            try: RecordNetworking.objects.get(id=removed).delete()
            except: 
                traceback.print_exc()
        # add new networking
        for new_networking in [i for i in networkings if len(i[0]) == 0]: 
            name = new_networking[1]
            phone = new_networking[2]
            rel = new_networking[3]
            networking_instance = RecordNetworking(record=s, name=name, phone=phone, relationship=rel)
            if len(phone or "") > 0:
                link = findRecord(name=name, phone=phone)
            else:
                link = Record.objects.filter(name=name)
            if len(link) == 1:
                networking_instance.link = link[0]
            elif len(link) == 0: 
                s = Record(name=name, phone1=phone, created_by=request.user)
                s.save()
                networking_instance.link = s
            networking_instance.save()
        # update networking
        for networking in networkings:
            if len(networking[0]) > 0 and networking[0] != -1:
                nid   = int(networking[0])
                name  = networking[1]
                phone = networking[2]
                rel   = networking[3]
                try: networking_instance = RecordNetworking.objects.get(id=nid)
                except RecordNetworking.DoesNotExist: continue
                networking_instance.name = name
                networking_instance.phone = phone
                networking_instance.relationship = rel
                if len(phone or "") > 0:
                    link = findRecord(name=name, phone=phone)
                else:
                    link = Record.objects.filter(name=name)
                if len(link) == 1:
                    networking_instance.link = link[0]
                elif len(link) == 0:
                    networking_instance.link = None
                networking_instance.save()

        if 'label' in self.request.data.keys():
            RecordLabel.objects.filter(record=s).delete()
            for _es in filter(lambda x: x != '', request.data['label'].split(',')):
                label = RecordLabel(record=s, label=Label.objects.get(id=int(_es)))
                label.save()
        return Response({'result': 'done', 'sid': s.id})

class UpdateRecordAPI(generics.GenericAPIView): ### unused
    permission_classes = (permissions.IsAuthenticated,)
    serializer_classes = [UpdateRecordSerializer, UpdateGenderSerializer]
    parser_classes = [parsers.MultiPartParser]

    def get_serializer_class(self):
        if 'gender' in self.request.data.keys():
            return UpdateGenderSerializer
        return UpdateRecordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.Meta.fields = list(request.data.keys())
        sid = request.data['id']
        record1 = Record.objects.get(id=sid)

        if 'remove-exp' in self.request.data.keys():
            tid = request.data.get('remove-exp')
            RecordExp.objects.filter(id=tid).delete()
            return Response({'result': 'done', 'sid': record1.id})
        elif 'update-exp' in self.request.data.keys():
            update_exp = request.data.get('update-exp').split(",")
            tid = update_exp[0]
            exp = update_exp[1]
            year = update_exp[2]
            _k = update_exp[3]
            if len(tid) > 0:
                _st = RecordExp.objects.get(id=tid)
                _st.exp = exp
                _st.year = year if len(year) > 0 else None
            elif len(exp) > 0:
                _st = RecordExp(record=record1, exp=exp, year=year if len(year) > 0 else None)
            else:
                return Response({'result': 'undone', 'sid': record1.id})
            _st.save()
            return Response({'result': 'done', 'sid': record1.id, 'stid': _st.id, 'k': _k})
        elif 'remove-networking' in self.request.data.keys():
            nid = request.data.get('remove-networking')
            RecordNetworking.objects.filter(id=nid).delete()
            return Response({'result': 'done', 'sid': record1.id})
        elif 'update-networking' in self.request.data.keys():
            update_netwoking = request.data.get('update-networking').split(",")
            nid = update_netwoking[0]
            name = update_netwoking[1].strip()
            phone = update_netwoking[2].replace("-", "")
            rel = update_netwoking[3].strip()
            _k = update_netwoking[4]
            if len(nid) > 0:
                _sn = RecordNetworking.objects.get(id=nid)
                _sn.name = name
                _sn.phone = phone
                _sn.rel = rel
            elif len(name) + len(phone) > 0:
                _sn = RecordNetworking(record=record1, name=name, phone=phone, relationship=rel)
            else:
                return Response({'result': 'undone', 'sid': record1.id})
            _r = findRecord(name=name, phone=phone)
            if len(_r) == 1: _sn.link = _r[0]
            _sn.save()
            return Response({'result': 'done', 'sid': record1.id, 'snid': _sn.id, 'k': _k})
        elif 'label' in self.request.data.keys():
            RecordLabel.objects.filter(record=record1).delete()
            for _es in filter(lambda x: x != '', request.data['label'].split(',')):
                label = RecordLabel(record=record1, label=Label.objects.get(id=int(_es)))
                label.save()
            return Response({'result': 'done', 'sid': record1.id})
        else:
            if serializer.is_valid():
                for k, v in serializer.validated_data.items():
                    if k == "introducer_name" or k == "introducer_phone":
                        s = findRecord(name=serializer.validated_data.get("introducer_name") or record1.introducer_name, phone=serializer.validated_data.get("introducer_phone") or record1.introducer_phone)
                        if len(s) == 0:
                            record1.introducer_link = None
                        elif len(s) == 1:
                            record1.introducer_link = s[0]
                    record1.__dict__[k] = v
                record1.save()
                return Response({'result': 'done', 'sid': record1.id})

        return Response({'result': 'error', 'msg': ';'.join([str(m[0]) for i, m in serializer.errors.items()])})


class RecordEventAPI(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_classes = [UpdateRecordSerializer]
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        sid = request.POST.get('sid')
        record_events = RecordEvent.objects.filter(record__id=sid).values('event_date', 'event_type__name')
        return Response({'result': 'done', 'events': record_events})

    def delete(self, request):
        sid = request.POST.get('sid')
        event_date = strptime(request.POST.get('event_date'), "%Y-%m-%d")
        try: event_type = EventType.objects.get(name=request.POST.get('event_type__name'))
        except EventType.DoesNotExist: return Response({'result': 'error', 'msg': 'event type not found.'})
        try: 
            record_event = RecordEvent.objects.get(record__id=sid, event_date=event_date, event_type=event_type)
            record_event.delete()
        except RecordEvent.DoesNotExist: return Response({'result': 'error', 'msg': 'record with event not found.'})
        return Response({'result': 'done', 'sid': sid})

### TODO: utilize serializer
class RecordAddEventAPI(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_classes = [UpdateRecordSerializer]
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        sid = request.POST.get('sid')
        try:
            date = strptime(request.POST.get('event_date'), "%Y-%m-%d")
            etype = request.POST.get('event_type')
            record_event = RecordEvent(record=Record.objects.get(id=sid), event_type=EventType.objects.get(id=etype), event_date=date)
            record_event.save()
            return Response({'result': 'done', 'sid': sid, 'event': record_event.id})
        except Exception as e:
            print(e)
            return Response({'result': 'error', 'msg': 'sid or eid not exists.'})

class RecordImageAPI(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        serializer = UploadRecordImageSerializer(data=request.data)
        if serializer.is_valid():
            s = findRecord(name=serializer.validated_data.get("name"), 
                phone=serializer.validated_data.get("phone1"))[0]
            s.img = serializer.validated_data.get("img")
            s.save()
            return Response({'result': 'done', 'msg': ''})
        else:
            print(serializer.errors)
            return Response({'result': 'error', 'msg': serializer.errors})
