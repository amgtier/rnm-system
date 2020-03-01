from django.forms import ModelForm
from .models import UploadXlsxBuffer

class XlsxUploadForm(ModelForm):
	class Meta:
		model = UploadXlsxBuffer
		fields = ['file']
