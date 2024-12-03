# Generated by Django 4.2.16 on 2024-12-03 13:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('course', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Module',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('sequence', models.PositiveIntegerField(help_text='The order of this module in the course.')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['sequence'],
            },
        ),
        migrations.CreateModel(
            name='Section',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('sequence', models.PositiveIntegerField(help_text='The order of this section within the module.')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['sequence'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='coursechapter',
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name='coursechapter',
            name='chapter',
        ),
        migrations.RemoveField(
            model_name='coursechapter',
            name='course',
        ),
        migrations.AlterField(
            model_name='course',
            name='visibility',
            field=models.CharField(choices=[('public', 'Public'), ('private', 'Private'), ('unlisted', 'Unlisted')], default='public', help_text='Set the visibility of the course.', max_length=50),
        ),
    ]
