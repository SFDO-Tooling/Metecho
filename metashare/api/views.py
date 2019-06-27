from django.contrib.auth import get_user_model
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Product
from .paginators import ProductPaginator
from .serializers import FullUserSerializer, ProductSerializer

User = get_user_model()


class UserView(generics.RetrieveAPIView):
    model = User
    serializer_class = FullUserSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return self.model.objects.filter(id=self.request.user.id)

    def get_object(self):
        return self.get_queryset().get()


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    pagination_class = ProductPaginator
