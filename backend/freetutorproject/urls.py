from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('account/', include('account.urls')),
    path('', RedirectView.as_view(url='/account/profile/', permanent=False)),
]
