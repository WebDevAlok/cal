# Generated by Django 4.2.16 on 2024-12-03 13:28

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tracking', '0002_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='chaptercompletion',
            name='chapter',
        ),
        migrations.RemoveField(
            model_name='studysession',
            name='chapter',
        ),
    ]
