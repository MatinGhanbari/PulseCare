# Generated by Django 4.2 on 2025-02-03 04:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pulseCare', '0004_patient_join_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='patient',
            name='join_date',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]
