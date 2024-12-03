# Generated by Django 4.2.16 on 2024-12-03 13:28

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('course', '0002_module_section_alter_coursechapter_unique_together_and_more'),
        ('study_content', '0008_remove_video_chapter_video_module_delete_article'),
        ('tracking', '0003_remove_chaptercompletion_chapter_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Chapter',
        ),
        migrations.DeleteModel(
            name='CourseChapter',
        ),
        migrations.AddField(
            model_name='section',
            name='module',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sections', to='course.module'),
        ),
        migrations.AddField(
            model_name='module',
            name='course',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='modules', to='course.course'),
        ),
        migrations.AlterUniqueTogether(
            name='section',
            unique_together={('module', 'sequence')},
        ),
        migrations.AlterUniqueTogether(
            name='module',
            unique_together={('course', 'sequence')},
        ),
    ]
