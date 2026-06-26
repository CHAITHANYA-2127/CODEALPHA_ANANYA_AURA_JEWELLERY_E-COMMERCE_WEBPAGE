from django.db import models
from django.contrib.auth.models import User

# Products


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.CharField(max_length=500)
    category = models.CharField(max_length=100)
    description = models.TextField(default="No description available")

    def __str__(self):
        return self.name


class CustomerProfile(models.Model):
    user = models.OneToOneField(User, related_name="customer_profile", on_delete=models.CASCADE)
    full_name = models.CharField(max_length=150, blank=True)
    dob = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)

    def __str__(self):
        return self.full_name or self.user.username


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, related_name="password_reset_tokens", on_delete=models.CASCADE)
    token = models.CharField(max_length=120, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def __str__(self):
        return f"Password reset for {self.user.email}"


# Orders

class Order(models.Model):
    user = models.ForeignKey(User, related_name="orders", null=True, blank=True, on_delete=models.CASCADE)
    order_id = models.CharField(max_length=50)
    customer_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    payment = models.CharField(max_length=50)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, default="Confirmed")
    order_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.order_id


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    image = models.CharField(max_length=500, blank=True)

    def __str__(self):
        return self.name

class Cart(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )

    qty = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"


class Wishlist(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"
