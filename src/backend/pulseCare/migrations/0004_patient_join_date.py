# Generated by Django 4.2 on 2025-02-02 20:44

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('pulseCare', '0003_patient'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='join_date',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
