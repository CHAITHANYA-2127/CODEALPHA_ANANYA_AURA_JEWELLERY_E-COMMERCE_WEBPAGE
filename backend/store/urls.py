from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register),
    path("login/", views.login),
    path("forgot-password/", views.forgot_password),
    path("reset-password/", views.reset_password),
    path("place-order/", views.place_order),
    path("products/", views.products),
    path("orders/", views.orders),
    path("orders/<int:user_id>/", views.user_orders),
    path("add-cart/",views.add_to_cart),
    path("cart/<int:user_id>/" ,views.get_cart),
    path("add-wishlist/",views.add_to_wishlist),
    path("wishlist/<int:user_id>/",views.get_wishlist),
    path("remove-wishlist/<int:wishlist_id>/",views.remove_wishlist),
    path("cart-count/<int:user_id>/",views.cart_count),
    path("wishlist-count/<int:user_id>/",views.wishlist_count),
    path("orders-count/<int:user_id>/",views.orders_count),
    path("update-cart/<int:cart_id>/",views.update_cart),
    path("remove-cart/<int:cart_id>/",views.remove_cart),
    path("remove-wishlist/<int:wishlist_id>/",views.remove_wishlist),
    path("order-details/<str:order_id>/",views.order_details),
    path("order-status/<str:order_id>/",views.update_order_status),
    path("product/<int:product_id>/",views.product_details),
    path("profile/<int:user_id>/",views.profile),
]
