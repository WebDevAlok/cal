# Generated by Django 4.2.16 on 2024-12-03 11:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('study_content', '0006_alter_videosegment_start_time'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='videosegment',
            name='unique_assessment_per_video',
        ),
        migrations.AddField(
            model_name='videosegment',
            name='sequence',
            field=models.PositiveIntegerField(default=1, help_text='The sequence of this segment within the video.'),
            preserve_default=False,
        ),
    ]
