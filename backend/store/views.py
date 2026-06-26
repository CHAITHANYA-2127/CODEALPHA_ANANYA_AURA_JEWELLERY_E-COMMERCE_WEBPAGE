from django.contrib.auth.models import User
from django.conf import settings
from django.core.mail import send_mail
from django.core.mail import BadHeaderError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from datetime import timedelta
import json
import secrets

from .models import Cart, CustomerProfile, Order, OrderItem, PasswordResetToken, Product, Wishlist


def read_json(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return {}


def profile_payload(user):
    profile, _ = CustomerProfile.objects.get_or_create(user=user)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": profile.full_name or user.username,
        "dob": profile.dob.isoformat() if profile.dob else "",
        "phone": profile.phone,
        "address": profile.address,
        "city": profile.city,
        "state": profile.state,
        "pincode": profile.pincode,
    }


def product_from_payload(data):
    product_id = data.get("product_id")
    if product_id:
        return Product.objects.get(id=product_id)

    name = data.get("name", "").strip()
    if not name:
        raise Product.DoesNotExist

    price = data.get("price") or 0
    image = data.get("image", "").strip()
    category = data.get("category", "Jewellery").strip() or "Jewellery"

    product = Product.objects.filter(name__iexact=name).first()
    if product:
        changed = False
        if image and product.image != image:
            product.image = image
            changed = True
        if price and str(product.price) != str(price):
            product.price = price
            changed = True
        if changed:
            product.save()
        return product

    return Product.objects.create(
        name=name,
        price=price,
        image=image,
        category=category,
        description=data.get("description", "Premium jewellery collection from Ananya Aura.")
    )


def order_payload(order):
    return {
        "order_id": order.order_id,
        "user_id": order.user_id,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "address": order.address,
        "city": order.city,
        "state": order.state,
        "pincode": order.pincode,
        "payment": order.payment,
        "status": order.status,
        "total_amount": str(order.total_amount),
        "order_date": order.order_date.strftime("%d-%m-%Y %I:%M %p"),
        "items": [
            {
                "name": item.name,
                "price": str(item.price),
                "qty": item.quantity,
                "image": item.image
            }
            for item in order.items.all()
        ]
    }


def wishlist_payload(item):
    return {
        "id": item.id,
        "product_id": item.product_id,
        "name": item.product.name,
        "price": float(item.product.price),
        "image": item.product.image,
        "category": item.product.category,
        "description": item.product.description,
    }


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    data = read_json(request)
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    dob = data.get("dob") or None

    if not username or not email or not password:
        return JsonResponse({
            "success": False,
            "message": "Username, email and password are required"
        }, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({
            "success": False,
            "message": "Username already exists"
        })

    if User.objects.filter(email=email).exists():
        return JsonResponse({
            "success": False,
            "message": "Email already exists"
        })

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )
    CustomerProfile.objects.create(
        user=user,
        full_name=data.get("full_name", "").strip(),
        dob=dob,
        phone=data.get("phone", "").strip(),
        address=data.get("address", "").strip(),
        city=data.get("city", "").strip(),
        state=data.get("state", "").strip(),
        pincode=data.get("pincode", "").strip(),
    )

    return JsonResponse({
        "success": True,
        "message": "Registration Successful",
        "user": profile_payload(user)
    })


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    data = read_json(request)
    email = data.get("email", "").strip()
    password = data.get("password", "")

    try:
        user = User.objects.get(email=email)

        if user.check_password(password):
            return JsonResponse({
                "success": True,
                "message": "Login Successful",
                "user": profile_payload(user)
            })

    except User.DoesNotExist:
        pass

    return JsonResponse({
        "success": False,
        "message": "Invalid Email or Password"
    })


@csrf_exempt
@require_http_methods(["POST"])
def forgot_password(request):
    data = read_json(request)
    email = data.get("email", "").strip()

    if not email:
        return JsonResponse({
            "success": False,
            "message": "Email is required"
        }, status=400)

    user = User.objects.filter(email=email).first()
    reset_link = ""
    mail_sent = False

    if user:
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        token = secrets.token_urlsafe(48)
        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=1)
        )
        reset_link = f"{settings.FRONTEND_BASE_URL}/forgot.html?token={token}"

        if settings.EMAIL_IS_CONFIGURED:
            try:
                send_mail(
                    "Reset your Ananya Aura Jewellery password",
                    (
                        "Hello,\n\n"
                        "Use this link to reset your password. It will expire in 1 hour:\n"
                        f"{reset_link}\n\n"
                        "If you did not request this, please ignore this email."
                    ),
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                mail_sent = True
            except (BadHeaderError, OSError, Exception):
                mail_sent = False

    response = {
        "success": True,
        "message": "If this email is registered, a password reset link has been sent."
    }

    if reset_link and not mail_sent:
        response["reset_link"] = reset_link
        response["message"] = "Email is not configured yet, so opening reset page directly."

    return JsonResponse(response)


@csrf_exempt
@require_http_methods(["POST"])
def reset_password(request):
    data = read_json(request)
    token = data.get("token", "").strip()
    password = data.get("password", "")

    if not token or not password:
        return JsonResponse({
            "success": False,
            "message": "Reset token and password are required"
        }, status=400)

    reset_token = PasswordResetToken.objects.filter(
        token=token,
        used=False,
        expires_at__gt=timezone.now()
    ).select_related("user").first()

    if not reset_token:
        return JsonResponse({
            "success": False,
            "message": "Reset link is invalid or expired"
        }, status=400)

    reset_token.user.set_password(password)
    reset_token.user.save()
    reset_token.used = True
    reset_token.save(update_fields=["used"])

    return JsonResponse({
        "success": True,
        "message": "Password reset successful. Please login with your new password."
    })


@csrf_exempt
@require_http_methods(["POST"])
def place_order(request):
    data = read_json(request)
    items = data.get("items", [])
    user_id = data.get("user_id")
    user = None

    if user_id:
        user = User.objects.filter(id=user_id).first()

    required = ["order_id", "customer_name", "phone", "address", "city", "state", "pincode", "payment", "total_amount"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return JsonResponse({
            "success": False,
            "message": "Missing fields: " + ", ".join(missing)
        }, status=400)

    order = Order.objects.create(
        user=user,
        order_id=data["order_id"],
        customer_name=data["customer_name"],
        phone=data["phone"],
        address=data["address"],
        city=data["city"],
        state=data["state"],
        pincode=data["pincode"],
        payment=data["payment"],
        total_amount=data["total_amount"],
        status=data.get("status", "Confirmed")
    )

    for item in items:
        OrderItem.objects.create(
            order=order,
            name=item.get("name", "Jewellery item"),
            price=item.get("price", 0),
            quantity=item.get("qty") or item.get("quantity") or 1,
            image=item.get("image", "")
        )

    if user and data.get("clear_cart"):
        Cart.objects.filter(user=user).delete()

    return JsonResponse({
        "success": True,
        "message": "Order Saved Successfully",
        "order_id": order.order_id
    })


@csrf_exempt
def products(request):
    all_products = Product.objects.all()

    data = []

    for p in all_products:
        data.append({
            "id": p.id,
            "name": p.name,
            "price": str(p.price),
            "image": p.image,
            "category": p.category,
            "description": getattr(p, "description", "")
        })

    return JsonResponse(data, safe=False)


@csrf_exempt
def orders(request):
    user_id = request.GET.get("user_id")
    all_orders = Order.objects.prefetch_related("items").order_by("-order_date")

    if user_id:
        all_orders = all_orders.filter(user_id=user_id)

    return JsonResponse([order_payload(order) for order in all_orders], safe=False)


@csrf_exempt
def user_orders(request, user_id):
    all_orders = Order.objects.filter(user_id=user_id).prefetch_related("items").order_by("-order_date")
    return JsonResponse([order_payload(order) for order in all_orders], safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def add_to_cart(request):
    data = read_json(request)
    user_id = data.get("user_id")

    try:
        User.objects.get(id=user_id)
        product = product_from_payload(data)

        cart_item = Cart.objects.filter(
            user_id=user_id,
            product=product
        ).first()

        if cart_item:

            cart_item.qty += 1
            cart_item.save()

        else:

            Cart.objects.create(
                user_id=user_id,
                product=product,
                qty=1
            )

        return JsonResponse({
            "success": True,
            "message": "Added To Cart"
        })

    except (Product.DoesNotExist, User.DoesNotExist, ValueError):

        return JsonResponse({
            "success": False,
            "message": "Error"
        }, status=400)
    
@csrf_exempt
def get_cart(request, user_id):

    cart_items = Cart.objects.filter(
        user_id=user_id
    )

    data = []

    for item in cart_items:

        data.append({

            "id": item.id,
            "product_id": item.product_id,

            "name": item.product.name,

            "price": float(
                item.product.price
            ),

            "image": item.product.image,

            "qty": item.qty

        })

    return JsonResponse(
        data,
        safe=False
    )
@csrf_exempt
@require_http_methods(["POST"])
def add_to_wishlist(request):
    data = read_json(request)
    user_id = data.get("user_id")

    try:
        User.objects.get(id=user_id)
        product = product_from_payload(data)

        exists = Wishlist.objects.filter(
            user_id=user_id,
            product=product
        ).exists()

        if exists:

            return JsonResponse({
                "success": False,
                "message": "Already In Wishlist"
            })

        item = Wishlist.objects.create(
            user_id=user_id,
            product=product
        )

        return JsonResponse({
            "success": True,
            "message": "Added To Wishlist",
            "item": wishlist_payload(item)
        })

    except (Product.DoesNotExist, User.DoesNotExist, ValueError):

        return JsonResponse({
            "success": False,
            "message": "Error"
        }, status=400)
@csrf_exempt
def get_wishlist(request, user_id):

    wishlist_items = Wishlist.objects.filter(
        user_id=user_id
    )

    data = []

    for item in wishlist_items:

        data.append(wishlist_payload(item))

    return JsonResponse(
        data,
        safe=False
    )
@csrf_exempt
def cart_count(request, user_id):

    count = sum(Cart.objects.filter(
        user_id=user_id
    ).values_list("qty", flat=True))

    return JsonResponse({
        "count": count
    })
@csrf_exempt
def wishlist_count(request, user_id):

    count = Wishlist.objects.filter(
        user_id=user_id
    ).count()

    return JsonResponse({
        "count": count
    })
@csrf_exempt
def remove_cart(request, cart_id):

    try:

        item = Cart.objects.get(
            id=cart_id
        )

        item.delete()

        return JsonResponse({
            "success": True,
            "message": "Removed From Cart"
        })

    except:

        return JsonResponse({
            "success": False
        })


@csrf_exempt
@require_http_methods(["POST"])
def update_cart(request, cart_id):
    data = read_json(request)
    qty = int(data.get("qty", 1))

    try:
        item = Cart.objects.get(id=cart_id)

        if qty <= 0:
            item.delete()
            return JsonResponse({"success": True, "message": "Removed From Cart"})

        item.qty = qty
        item.save(update_fields=["qty"])
        return JsonResponse({"success": True, "message": "Cart Updated"})

    except (Cart.DoesNotExist, ValueError):
        return JsonResponse({"success": False, "message": "Cart item not found"}, status=404)
@csrf_exempt
def remove_wishlist(request, wishlist_id):

    try:

        item = Wishlist.objects.get(
            id=wishlist_id
        )

        item.delete()

        return JsonResponse({
            "success": True,
            "message": "Removed From Wishlist"
        })

    except:

        return JsonResponse({
            "success": False
        })
@csrf_exempt
def order_details(request, order_id):
    order = None
    if str(order_id).isdigit():
        order = Order.objects.filter(id=order_id).prefetch_related("items").first()

    if not order:
        order = Order.objects.filter(order_id=order_id).prefetch_related("items").first()

    if not order:
        return JsonResponse({"error": "Order Not Found"}, status=404)

    data = [
        {
            "name": item.name,
            "price": float(item.price),
            "qty": item.quantity,
            "image": item.image
        }
        for item in order.items.all()
    ]

    return JsonResponse(data, safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def update_order_status(request, order_id):
    data = read_json(request)
    user_id = data.get("user_id")
    status = data.get("status", "").strip()
    allowed_statuses = {"Confirmed", "Shipped", "Delivered", "Cancelled", "Returned"}

    if status not in allowed_statuses:
        return JsonResponse({"success": False, "message": "Invalid status"}, status=400)

    order = Order.objects.filter(order_id=order_id, user_id=user_id).first()
    if not order:
        return JsonResponse({"success": False, "message": "Order not found"}, status=404)

    order.status = status
    order.save(update_fields=["status"])
    return JsonResponse({"success": True, "message": "Order status updated", "status": order.status})


@csrf_exempt
def product_details(request, product_id):

    try:
        product = Product.objects.get(id=product_id)

        return JsonResponse({
            "id": product.id,
            "name": product.name,
            "price": str(product.price),
            "image": product.image,
            "category": product.category,
            "description": product.description
        })

    except Product.DoesNotExist:
        return JsonResponse({
            "error": "Product Not Found"
        }, status=404)
@csrf_exempt
def profile(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except (User.DoesNotExist, ValueError):
        return JsonResponse({"error": "User Not Found"}, status=404)

    if request.method == "POST":
        data = read_json(request)
        profile_obj, _ = CustomerProfile.objects.get_or_create(user=user)
        username = data.get("username", "").strip()
        email = data.get("email", "").strip()

        if username and username != user.username:
            if User.objects.exclude(id=user.id).filter(username=username).exists():
                return JsonResponse({"success": False, "message": "Username already exists"}, status=400)
            user.username = username

        if email and email != user.email:
            if User.objects.exclude(id=user.id).filter(email=email).exists():
                return JsonResponse({"success": False, "message": "Email already exists"}, status=400)
            user.email = email

        user.save()
        profile_obj.full_name = data.get("full_name", profile_obj.full_name).strip()
        profile_obj.dob = data.get("dob") or None
        profile_obj.phone = data.get("phone", profile_obj.phone).strip()
        profile_obj.address = data.get("address", profile_obj.address).strip()
        profile_obj.city = data.get("city", profile_obj.city).strip()
        profile_obj.state = data.get("state", profile_obj.state).strip()
        profile_obj.pincode = data.get("pincode", profile_obj.pincode).strip()
        profile_obj.save()
        return JsonResponse({"success": True, "user": profile_payload(user)})

    return JsonResponse(profile_payload(user))


@csrf_exempt
def orders_count(request, user_id):
    count = Order.objects.filter(user_id=user_id).count()
    return JsonResponse({"count": count})
