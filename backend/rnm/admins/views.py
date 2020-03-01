import json
import datetime
from django.http import HttpResponseRedirect, JsonResponse
from django.utils import timezone
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User, Group
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, status, views, viewsets, parsers
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from .serializers import UserSerializer, UserSerializerWithToken, LoginUserSerializer, DeleteEventTypeSerializer, DeleteLabelSerializer, EventTypeSerializer, LabelSerializer, EditUserSerializer, RegisterSerializer, ResetPasswordSerializer, ForgetPasswordSerializer
from .permissions import get_user_permission, userRole
from records.models import EventType, RecordEvent, Label, RecordLabel
from .models import ManagerJurisdiction, ResetPassword

@api_view(['GET'])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class LoginAPI(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = LoginUserSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            username = serializer.data.get("username")
            u = User.objects.get(username=username)
            u.last_login = timezone.make_aware(datetime.datetime.now())
            u.save()
            return Response(serializer.data)
        return Response({'message': 'login failed'}, status=status.HTTP_200_OK)

class UserList(views.APIView):
    parser_classes = [parsers.MultiPartParser]
    def get(self, request):
        users = User.objects.all().values('id', 'username', 'email', 'last_login')
        for u in users:
            u['role'] = get_user_permission(User.objects.get(id=u['id']))
            u['last_login'] = timezone.localtime(u['last_login']).strftime("%Y-%m-%d %H:%M%S") if u['last_login'] else None
            jur = list(ManagerJurisdiction.objects.filter(user__id=u['id']).values('id', 'city', 'township', 'village'))
            u['jur'] = jur
        users = sorted(users, key=lambda X: X['role'])
        return Response({'result': 'done', 'users': users, 'username': request.user.username, 'role': userRole(request.user)})

    def post(self, request, format=None):
        serializer = UserSerializerWithToken(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        serializer = EditUserSerializer(data=request.data) 
        if serializer.is_valid():
            uid = serializer.validated_data.get("uid")
            email = serializer.validated_data.get("email")
            _u = User.objects.get(id=uid)
            if uid == request.user.id: ### self can only amend email
                if email:
                    _u.email = email
                _u.save()
                return Response({'result': 'done'})

            role = serializer.validated_data.get("role")
            _u.groups.clear()
            if role == 'admin':
                _u.is_superuser = True
            elif role != 'nobody':
                _u.is_superuser = False
                _g = Group.objects.get(name=role)
                _u.groups.add(_g)

            if email:
                _u.email = email
            _u.save()

            if role == 'manager':
                jid = serializer.validated_data.get("jid")
                city = serializer.validated_data.get("city")
                township = serializer.validated_data.get("township")
                village = serializer.validated_data.get("village")

                ### remove jid not exists
                _jid = ManagerJurisdiction.objects.filter(user__id=uid).values('id')
                for j in _jid:
                    if j["id"] not in [int(i) for i in jid]:
                        ManagerJurisdiction.objects.get(id=j['id']).delete()

                for j, c, t, v in zip(jid, city, township, village):
                    if len(c) + len(t) + len(v) == 0: continue
                    if int(j) != -1:
                        jd = ManagerJurisdiction.objects.get(id=int(j))
                    else:
                        jd = ManagerJurisdiction(user=_u)
                    jd.city = c
                    jd.township = t
                    jd.village = v
                    jd.save()

            return Response({'result': 'done'})
        else:
            print(serializer.errors)
            return Response({'hello': 'failed', 'msg': serializer.errors})
        print("Bye bye")

def eventTypes(request):
    data = json.dumps({'event_type':
        list(EventType.objects.all().values('id', 'name'))
        }, ensure_ascii=False)
    return JsonResponse(data, safe=False)

def labels(request):
    data = json.dumps({'label':
        list(Label.objects.all().values('id', 'name'))
        }, ensure_ascii=False)
    return JsonResponse(data, safe=False)

class EventTypeAPI(generics.GenericAPIView):
    parser_classes = [parsers.MultiPartParser]

    def get_serializer_class(self):
        if self.request.method == "DELETE":
            return DeleteEventTypeSerializer
        elif self.request.method == "POST":
            return EventTypeSerializer

    def get(self, request):
        event_types = EventType.objects.all().values('id', 'name')
        record_event = RecordEvent.objects.all().values('event_type').distinct()
        record_event = [i['event_type'] for i in record_event]
        for e in event_types:
            e['removable'] = e['id'] not in record_event
        return Response({'event_type': event_types})

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            _e = EventType(name=serializer.validated_data.get('name'))
            _e.save()
            return Response({'result': 'done'})
        return Response({'result': 'failed'})

    def delete(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            eid = serializer.validated_data.get('id')
            if len(RecordEvent.objects.filter(event_type__id=eid)) == 0:
                _e = EventType.objects.get(id=eid)
                _e.delete()
                return Response({'result': 'done'})
            else:
                return Response({'result': 'event type not empty'})

class LabelAPI(generics.GenericAPIView):
    parser_classes = [parsers.MultiPartParser]
    def get_serializer_class(self):
        if self.request.method == "DELETE":
            return DeleteLabelSerializer
        elif self.request.method == "POST":
            return LabelSerializer

    def get(self, request):
        label = Label.objects.all().values('id', 'name')
        record_label = RecordLabel.objects.all().values('label').distinct()
        record_label = [i['label'] for i in record_label]
        for s in label:
            s['removable'] = s['id'] not in record_label
        return Response({'label': label})

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            _es = Label(name=serializer.validated_data.get('name'))
            _es.save()
            return Response({'result': 'done'})
        return Response({'result': 'failed'})

    def delete(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            esid = serializer.validated_data.get('id')
            if len(RecordLabel.objects.filter(label__id=esid)) == 0:
                _es = Label.objects.get(id=esid)
                _es.delete()
                return Response({'result': 'done'})
            else:
                return Response({'result': 'label not empty'})

class RegisterAPI(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            u = serializer.save()
            u.set_password(serializer.validated_data.get("password"))
            u.save()
            return Response({'result': 'done', 'username': u.username, 'id': u.id})
        else:
            print(serializer.errors)
            return Response({'result': 'failed', 'msg': serializer.errors})

class ResetPasswordAPI(generics.GenericAPIView):
    parser_classes = [parsers.MultiPartParser]
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data.get("username") == request.user.username and serializer.validated_data.get("oldpassword") is None:
                return Response({'result': 'faile', }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            u = User.objects.get(username=serializer.validated_data.get("username"))
            u.set_password(serializer.validated_data.get("password"))
            u.save()
            return Response({'result': 'done'})
        else:
            return Response({'result': 'failed', 'msg': serializer.errors})

class ResetPasswordHashAPI(generics.GenericAPIView):
    parser_classes = [parsers.MultiPartParser]
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        h = request.data.get("hash")
        target = ResetPassword.objects.get(hash=h)
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            u = User.objects.get(username=serializer.validated_data.get("username"))
            u.set_password(serializer.validated_data.get("password"))
            u.save()
            target.delete()
            return Response({'result': 'done'})
        else:
            return Response({'result': 'failed', 'msg': serializer.errors})            
        return Response({'result': 'failed', 'msg': 'hash not found'})

    def put(self, request):
        h = request.data.get("hash")
        target = ResetPassword.objects.filter(hash=h).values('user__username', 'user__id', 'create_time')
        ### delete all expired.
        no_older_than_1day = timezone.now() - timezone.timedelta(days=1)
        ResetPassword.objects.filter(create_time__lt=no_older_than_1day).delete()
        if len(target) == 1:
            target = target[0]
            return Response({'result': 'done', 'target': target})
        return Response({'result': 'failed', 'msg': 'hash not found'})


class ForgetPasswordAPI(generics.GenericAPIView):
    parser_classes = [parsers.MultiPartParser]
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = ForgetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            fp = ResetPassword(user=User.objects.get(email=serializer.validated_data.get("email")))
            fp.save()
            rp_url = "{}/reset_password/{}".format(request.META['HTTP_HOST'], fp.hash)
            subject = "[Relationship Networking Management System] Reset Password"
            message = "<h1>Relationship Networking Management System</h1><h2>Reset Password</h2><p>Click the link below within 24 hours to reset your password.</p><p><a href='{}' target='_blank'>RESET PASSWORD</a></p>".format(rp_url)
            email_from = settings.EMAIL_HOST_USER
            recipients = [serializer.validated_data.get("email")]
            send_mail(subject, message, email_from, recipients, html_message=message)
            return Response({'result': 'done'})
        else:
            return Response({'result': 'failed'})