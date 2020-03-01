import json
import datetime
import traceback
import numpy as np
import pandas as pd
from .constants import *
from .models import Record, RecordLabel, Label, RecordExp, RecordEvent, EventType, RecordNetworking
from django.db.models import Q
from django.db import IntegrityError
from django.contrib.auth.models import User
from admins.permissions import userRole
from admins.models import ManagerJurisdiction

def xlsxToJson(xlsx_path, add_event=False):
    xlsx = pd.read_excel(xlsx_path)
    xlsx = xlsx.fillna('')
    _json = []
    ### check len of column
    if add_event:
        if not len(xlsx.columns) == 2: return COLUMNS_INCONSISTENT, (2, len(xlsx.columns))
    else:
        if not len(xlsx.columns) == 24: return COLUMNS_INCONSISTENT, (24, len(xlsx.columns))
    ##################
    ### Clean raw data
    ##################
    for idx, row in xlsx.iterrows():
        if add_event:
            ################
            ### event
            ################
            name = Cleaned.strip(row[0])
            if len(name or "") == 0: continue
            phone1 = Cleaned.phone(row[1])
            status = ""
            _json.append({'status': status, 'name': name, 'phone1': phone1})
        else:
            #################
            ### roster
            #################
            ### 3
            name = Cleaned.strip(row[0])
            gender = Cleaned.gender(row[1])
            phone1 = Cleaned.phone(row[2])
            phone2 = Cleaned.phone(row[2], 1)
            if len(name or "") == 0: continue
            if len(name or "") + len(phone1 or "") + len(phone2 or "") == 0: continue
            landline = Cleaned.phone(row[3])
            email = Cleaned.strip(row[4])
            city = Cleaned.strip(row[5])
            township = Cleaned.strip(row[6])
            village = Cleaned.strip(row[7])
            address = Cleaned.address(row[8])
            building = Cleaned.address(row[9])
            res_address = Cleaned.address(row[10])
            birthday = Cleaned.birthday(row[11])
            introducer_name = Cleaned.address(row[12])
            introducer_phone = Cleaned.phone(row[13])
            spouse_name = Cleaned.address(row[14])
            spouse_phone = Cleaned.phone(row[15])

            label1 = Cleaned.strip(row[16])
            label2 = Cleaned.strip(row[17])
            label3 = Cleaned.strip(row[18])
            label4 = Cleaned.strip(row[19])
            label5 = Cleaned.strip(row[20])
            label6 = Cleaned.strip(row[21])
            exp_year1 = Cleaned.year(row[22])
            exp_name1 = Cleaned.strip(row[23])

            status = ""

            _json.append({'status': status,
                'name': name, 'gender': gender, 'phone1': phone1, 'phone2': phone2, 'landline': landline, 'email': email, 
                'city': city, 'township': township, 'village': village, 'address': address, 'building': building,
                'res_address': res_address, 'birthday': birthday, 
                'introducer_name': introducer_name, 'introducer_phone': introducer_phone,
                'spouse_name': spouse_name, 'spouse_phone': spouse_phone, 
                'label': [idx+1 for idx, v in enumerate([label1, label2, label3, label4, label5, label6]) if v != None],
                'exps': [(y, t) for y, t in [(exp_year1, exp_name1)] if y != None and t != None]}
                )
    return 'ok', json.dumps(_json, ensure_ascii=False).replace("NaN", '""')

def findRecord(name, phone):
    return Record.objects.filter(Q(name=name) & (Q(phone1=phone) | Q(phone2=phone)))

def linkIntroducerSpouse(record, target_record, dry=True, request_user=None):
    if target_record.get('introducer_name', '') != None and target_record.get('introducer_phone', '') != None:
        introducer = findRecord(target_record.get('introducer_name'), target_record.get('introducer_phone'))
        if len(introducer) == 0:
            introducer = createRecordLeastField(
                name=target_record.get('introducer_name'), 
                phone1=target_record.get('introducer_phone'), 
                request_user=request_user,
                )
        else:
            introducer = introducer[0]
        record.introducer_link = introducer

    ### link spouse
    if target_record.get('spouse_name', '') != None and target_record.get('spouse_phone', '') != None:
        spouse = findRecord(target_record.get('spouse_name'), target_record.get('spouse_phone'))
        if len(spouse) == 0:
            spouse = createRecordLeastField(
                name=target_record.get('spouse_name'), 
                phone1=target_record.get('spouse_phone'),
                request_user=request_user,
                )
        else:
            spouse = spouse[0]
        record.spouse_link = spouse
    if not dry: record.save()

def createRecordLeastField(name, phone1, request_user):
    record = Record(name=name, phone1=phone1, created_by=request_user)
    record.save()
    record.introducer_name = name
    record.introducer_phone = phone1
    record.introducer_link = record
    record.save()
    return record

def checkExistingRecords(_json, add_event=False, request_user=None, dry=True):
    try:
        len_success = 0
        for target_record in _json:
            name = target_record.get('name')
            phone1 = target_record.get('phone1')
            record = findRecord(name, phone1)
            if len(record) == 0:
                target_record['status'] = NEW_RECORD
                if not dry:
                    if add_event:
                        ### not used
                        createRecordLeastField(name=name, phone1=phone1, request_user=request_user)
                    else:
                        record = Record(
                            ### 1
                            name=target_record.get('name'),
                            gender=target_record.get('gender'),
                            phone1=target_record.get('phone1'),
                            phone2=target_record.get('phone2'),
                            landline=target_record.get('landline'),
                            email=target_record.get('email'),
                            city=target_record.get('city'),
                            township=target_record.get('township'),
                            village=target_record.get('village'),
                            address=target_record.get('address'),
                            building=target_record.get('building'),
                            res_address=target_record.get('res_address'),
                            birthday=strptime(target_record.get('birthday'), "%Y%m%d"),
                            introducer_name=target_record.get('introducer_name'),
                            introducer_phone=target_record.get('introducer_phone'),
                            spouse_name=target_record.get('spouse_name'),
                            spouse_phone=target_record.get('spouse_phone'),
                            created_by=request_user,
                            )
                        record.save()
                        if record.introducer_name == '' and record.introducer_phone == '':
                            record.introducer_name = name
                            record.introducer_phone = phone1
                            record.introducer_link = record
                            record.save()

                        ### link introducer
                        linkIntroducerSpouse(record, target_record, dry=False, request_user=request_user)

                        _label = set(target_record.get('label'))
                        _exp = set([(y, t) for y, t in target_record.get('exps')])
                        for _es in _label:
                            x = RecordLabel(record=record, label=Label.objects.get(id=_es))
                            x.save()
                        for _y, _t in _exp:
                            x = RecordExp(record=record, year=_y, exp=_t)
                            x.save()
                    len_success += 1
            else:
                record = record[0]
                if add_event: target_record['status'] = ADD_EVENT_SUPPORTER
                else:
                    ### 2
                    _update = False
                    _conflict = False
                    _conflict_message = record.conflict if record.conflict != None else ''
                    _update, _conflict, _conflict_message = checkUpdateConflict('gender', record, target_record, _update, _conflict, _conflict_message)
                    ### phone
                    _update, _conflict, _conflict_message = checkUpdateConflict('landline', record, target_record, _update, _conflict, _conflict_message)
                    _update, _conflict, _conflict_message = checkUpdateConflict('email', record, target_record, _update, _conflict, _conflict_message)
                    _update, _conflict, _conflict_message = checkUpdateConflict('city', record, target_record, _update, _conflict, _conflict_message)
                    _update, _conflict, _conflict_message = checkUpdateConflict('township', record, target_record, _update, _conflict, _conflict_message)
                    _update, _conflict, _conflict_message = checkUpdateConflict('village', record, target_record, _update, _conflict, _conflict_message)
                    _update, _conflict, _conflict_message = checkUpdateConflict('address', record, target_record, _update, _conflict, _conflict_message)
                    _update, _conflict, _conflict_message = checkUpdateConflict('building', record, target_record, _update, _conflict, _conflict_message)
                    _update, _conflict, _conflict_message = checkUpdateConflict('res_address', record, target_record, _update, _conflict, _conflict_message)
                    ### birthday
                    _update, _conflict, _conflict_message = checkUpdateConflict('introducer_name', record, target_record, _update, _conflict, _conflict_message)
                    # _update, _conflict, _conflict_message = checkUpdateConflict('introducer_phone', record, target_record, _update, _conflict, _conflict_message)
                    _update, _conflict, _conflict_message = checkUpdateConflict('spouse_name', record, target_record, _update, _conflict, _conflict_message)
                    # _update, _conflict, _conflict_message = checkUpdateConflict('spouse_phone', record, target_record, _update, _conflict, _conflict_message)

                    ### update introducer or spouse

                    ### EstSrc
                    _label = RecordLabel.objects.filter(record=record).values('label')
                    _label = [_label['label'] for _label in _label]
                    _label = set(target_record.get('label')) - set(_label)

                    ### RecordExp
                    _exp = RecordExp.objects.filter(record=record).values('year', 'exp')
                    _exp = [(_t['year'], _t['exp']) for _t in _exp]
                    _exp = set([(y, t) for y, t in target_record.get('exps')]) - set(_exp)
                    if len(_label) > 0 or len(_exp) > 0: _update = True

                    ### new_sup-update-conflict status
                    if _conflict:
                        target_record['status'] = CONFLICT_SUPPORTER
                        record.conflict = _conflict_message
                    elif _update: target_record['status'] = UPDATE_SUPPORTER
                    else: target_record['status'] = ''
                    print(target_record['status'], _conflict_message)

                    if not dry:
                        record.save()

                        for _es in _label:
                            try:
                                x = RecordLabel(record=record, label=Label.objects.get(id=_es))
                                x.save()
                            except IntegrityError as e:
                                print(e)
                        for _y, _t in _exp:
                            try:
                                x = RecordExp(record=record, year=_y, exp=_t)
                                x.save()
                            except IntegrityError as e:
                                print(e)

                        ### link introducer
                        len_success += 1
    except:
        with open("import_error.log", "a") as f:
            f.write("\n{}{}\n".format("=" * 20, datetime.datetime.now()))
            traceback.print_exc(file=f)
            traceback.print_exc()
    if not dry:
        return len_success, _json
    else:
        return _json

def checkUpdateConflict(field, record, target_record, _update, _conflict, _conflict_message):
    ''' not saved in this function '''
    if target_record.get(field) != None:
        if len(str(target_record.get(field))) > 0:
            if eval('record.{}'.format(field)) == None:
                _s = target_record.get(field)
                exec('record.{}=_s'.format(field, ))
                _update = True
            elif eval('record.{}'.format(field)) != target_record.get(field):
                _msg = '{}: {} \n'.format(field, target_record.get(field))
                if _conflict_message.find(_msg) == -1:
                    _conflict_message += '{}: {} \n'.format(field, target_record.get(field))
                _conflict = True
    return _update, _conflict, _conflict_message

def addEvent(s, t, d):
    t = EventType.objects.get(id=int(t))
    try:
        e = RecordEvent(record=s, event_type=t, event_date=d)
        e.save()
    except IntegrityError as e: print(e)

class Cleaned:
    def strip(s):
        s = str(s).replace(' ', '')
        if len(s) > 0:
            return s
        else:
            return None

    def gender(s):
        s = str(s).replace(' ', '')
        if len(s) > 0:
            if s[0].lower() == "m":
                return "m"
            elif s[0].lower() == "f":
                return "f"
        else: return None

    def phone(s, seq=0):
        if isinstance(s, float): s = int(s)
        s = str(s).replace("-", "").split()
        try: s = s[seq]
        except IndexError: return None
        if len(s) > 0:
            if len(s) == 9 and s[0] == "9":
                s = "0" + s
            elif s[:len("8869")] == "8869":
                s = "0" + s[len("8869"):]
            elif s[:len("8869")] == "+8869":
                s = "0" + s[len("+8869"):]
            return s[:10]
        else: return None

    def landline(s):
        if isinstance(s, float): s = int(s)
        s = str(s).replace("-", "").split()
        if len(s) > 0:
            ### clean landline
            return s[:10]
        else: return None

    def address(s):
        s = str(s).replace(' ', '')
        ###
        ### handle digits
        ###
        if len(s) > 0:
            return s
        else:
            return None

    def birthday(s):
        if isinstance(s, str):
            s = s.replace("/", "-").split("-")
            if len(s) != 3: return "-".join(s)
            else:
                # if int(s[0]) < 1900:
                #     # Taiwan Calendar
                #     s[0] = str(int(s[0]) + 1911)
                return datetime.datetime.strptime("-".join(s), "%Y-%m-%d").strftime("%Y%m%d")
        elif isinstance(s, datetime.date):
            return s.strftime("%Y%m%d")

    def year(s):
        try: return int(s)
        except: return None

def strptime(s, f):
    try: return datetime.datetime.strptime(s, f)
    except ValueError: return None

def resultByCriteria(post_data, user):
    urole = userRole(user)
    if urole in [SUPERUSER, READER]:
        results = Record.objects.all()
        results = filterResultByCriteria(results, post_data)
    elif urole == LEADER:
        jd = ManagerJurisdiction.objects.filter(user=user).values('city', 'township', 'village')
        results = Record.objects.filter(created_by=user)
        results = filterResultByCriteria(results, post_data)
        for x in jd:
            c = x.get("city").strip()
            t = x.get("township").strip()
            v = x.get("village").strip()
            if len(c) + len(t) + len(v) == 0: continue
            t_results = Record.objects.all()
            t_results = filterResultByCriteria(t_results, post_data)
            if c != '': t_results = t_results.filter(city__contains=c)
            if t != '': t_results = t_results.filter(township__contains=t)
            if v != '': t_results = t_results.filter(village__contains=v)
            results = results.union(t_results)
    elif urole == NOBODY: ## bye-bye
        return Record.objects.none()

    ### result fields
    show_prefix = "show-"
    show_fields = ["id", "name", "img"] + [i[len(show_prefix):] for i in post_data.keys() if i.find(show_prefix) != -1]
    _show_fields = list(filter(lambda x: x in set([str(i)[len("records.Record."):] for i in Record._meta.fields]), show_fields))
    results = results.values(*_show_fields)
    for each in results:
        if "label" in show_fields:
            each["label"] = ", ".join([str(i[0]) for i in RecordLabel.objects.filter(record__id=each['id']).values_list("label__name")])
        if "event" in show_fields:
            each["event"] = ", ".join(["({}, {})".format(i[0], i[1]) for i in RecordEvent.objects.filter(record__id=each['id']).values_list("event_date", "event_type__name")])
        if "exp_name" in show_fields:
            each["exp"] = ", ".join(["({}, {})".format(i[0], i[1]) for i in RecordExp.objects.filter(record__id=each['id']).values_list("year", "exp")])
        if "created_by" in show_fields:
            try: each["created_by"] = User.objects.get(id=each["created_by"]).username
            except: each["created_by"] = 'No Record.'
        if "create_time" in show_fields:
            each["create_time"] = each["create_time"].strftime("%Y-%m-%d %H:%M:%S")
        if "landline" in show_fields:
            each["landline"] = dashedPhone(each["landline"])

        each["phone1"] = dashedPhone(each["phone1"])
        # each["phone2"] = dashedPhone(each["phone2"])
    return results

def filterResultByCriteria(results, post_data):
    if len(post_data.get('name', '')) > 0:
        name = post_data.get('name').strip()
        results = results.filter(name__contains=name)

    if len(post_data.get('phone', '')) > 0:
        print('phone', post_data.get('phone'))
        phone = post_data.get('phone')
        results = results.filter(Q(phone1__contains=phone)|Q(phone2__contains=phone))

    if len(post_data.get('city', '')) > 0:
        city = post_data.get('city')
        results = results.filter(city__contains=city)

    if len(post_data.get('township', '')) > 0:
        township = post_data.get('township')
        results = results.filter(township__contains=township)

    if len(post_data.get('village', '')) > 0:
        village = post_data.get('village')
        results = results.filter(village__contains=village)

    if len(post_data.get('address', '')) > 0:
        address = post_data.get('address')
        results = results.filter(address__contains=address)

    if len(post_data.get('building', '')) > 0:
        building = post_data.get('building')
        results = results.filter(building__contains=building)

    if len(post_data.get('introducer_name', '')) > 0:
        introducer_name = post_data.get('introducer_name')
        results = results.filter(introducer_name__contains=introducer_name)

    ### Label Filter
    if len(post_data.get('label', '')) > 0:
        _label = list(post_data.get('label').split(",")) 
        ### Intersects
        for i in _label:
            results = results.filter(recordestsource__label__id=int(i))
        ### Union
        # _label = [Q(recordestsource__label__id=i) for i in _label]
        # _q = _label.pop()
        # for i in _label:
        #     _q |= i
        # results = results.filter(_q)

    ### Exp Filter
    if len(post_data.get('exp_name', '')) > 0:
        results = results.filter(recordexp__exp__contains=post_data.get('exp_name'))

    ### I need a better solution for this. ###
    event_name1 = post_data.get('event_name1', '').strip()
    event_name2 = post_data.get('event_name2', '').strip()
    event_date1 = post_data.get('event_date1', '')
    event_date2 = post_data.get('event_date2', '')
    try: event_type1 = EventType.objects.get(name=event_name1)
    except: event_type1 = None
    try: event_type2 = EventType.objects.get(name=event_name2)
    except: event_type2 = None
    if len(event_date1) > 0 and len(event_date2) > 0 and event_type1 and event_type2:
        event_date1 = datetime.datetime.strptime(event_date1, "%Y-%m-%d")
        event_date2 = datetime.datetime.strptime(event_date2, "%Y-%m-%d")
        results = results.filter(Q(recordevent__event_date=event_date1, recordevent__event_type=event_type1) | Q(recordevent__event_date=event_date2, recordevent__event_type=event_type2))
    if len(event_date1) > 0 and len(event_date2) > 0:
        event_date1 = datetime.datetime.strptime(event_date1, "%Y-%m-%d")
        event_date2 = datetime.datetime.strptime(event_date2, "%Y-%m-%d")
        results = results.filter(Q(recordevent__event_date=event_date1) | Q(recordevent__event_date=event_date2))
    if event_type1 and event_type2:
        results = results.filter(Q(recordevent__event_type=event_type1) | Q(recordevent__event_type=event_type2))
    elif len(event_date1) > 0 and event_type1:
        event_date1 = datetime.datetime.strptime(event_date1, "%Y-%m-%d")
        results = results.filter(recordevent__event_date=event_date1, recordevent__event_type=event_type1)
    elif len(event_date2) > 0 and event_type2:
        event_date2 = datetime.datetime.strptime(event_date2, "%Y-%m-%d")
        results = results.filter(recordevent__event_date=event_date2, recordevent__event_type=event_type2)
    elif event_type1:
        results = results.filter(recordevent__event_type=event_type1)
    elif event_type2:
        results = results.filter(recordevent__event_type=event_type2)
    elif len(event_date1) > 0:
        event_date1 = datetime.datetime.strptime(event_date1, "%Y-%m-%d")
        results = results.filter(recordevent__event_date=event_date1)
    elif len(event_date2) > 0:
        event_date2 = datetime.datetime.strptime(event_date2, "%Y-%m-%d")
        results = results.filter(recordevent__event_date=event_date2)
    return results

def resultBySid(post_data, user):
    results = Record.objects.all()
    sid = post_data.get('sid')
    results = results.filter(id=sid).values()
    for each in results:
        each["label"] = [i[0] for i in RecordLabel.objects.filter(record__id=each['id']).values_list("label__id")]
        each["event"] = [(i[0], i[1]) for i in RecordEvent.objects.filter(record__id=each['id']).values_list("event_date", "event_type__name")]
        each["exp"] = list(RecordExp.objects.filter(record__id=each['id']).values_list("id", "year", "exp"))
        each["networking"] = list(RecordNetworking.objects.filter(Q(record__id=each['id'])).values_list("id", "name", "phone", "relationship", "link"))
        each["networking_passive"] = list(RecordNetworking.objects.filter(Q(link__id=each['id'])).values_list("record__name", "record__phone1", "relationship", "record"))
    return results

def dashedPhone(p):
    if p == None: return None
    if len(p) == 10:
        return "{}-{}-{}".format(p[:4], p[4:7], p[7:])
    elif len(p) == 9:
        return "{}-{}-{}".format(p[:2], p[2:5], p[5:])
    else:
        return p

def checkRequiredFailed(s):
    if None in [s.phone1, s.city, s.township, s.village]:
        return True
    else: return False

def defaultEventTypes():
    for n in ["Family Reunion", "Alumni Reunion", "Outing", "Bussiness Meeting"]:
        e = EventType(name=n)
        e.save()

def defaultLabels():
    for s in ["Family", "Friend", "Work", "Customer", "Acquaintance", "Alumni"]:
        es = Label(name=s)
        es.save()

def defaultGroups():
    from django.contrib.auth.models import Group
    for g in ["manager", "reader"]:
        _g = Group(name=g)
        _g.save()