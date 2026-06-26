from django.contrib import admin
from .models import Cart, CustomerProfile, Order, OrderItem, PasswordResetToken, Product, Wishlist

admin.site.register(CustomerProfile)
admin.site.register(PasswordResetToken)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Cart)
admin.site.register(Wishlist)
