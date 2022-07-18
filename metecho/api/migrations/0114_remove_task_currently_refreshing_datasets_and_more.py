# Generated by Django 4.0.6 on 2022-07-18 17:30

import django.core.serializers.json
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0113_remove_task_currently_capturing_dataset_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="task",
            name="currently_refreshing_datasets",
        ),
        migrations.RemoveField(
            model_name="task",
            name="datasets",
        ),
        migrations.RemoveField(
            model_name="task",
            name="datasets_parse_errors",
        ),
        migrations.AddField(
            model_name="scratchorg",
            name="currently_refreshing_datasets",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="scratchorg",
            name="datasets",
            field=models.JSONField(
                blank=True,
                default=dict,
                encoder=django.core.serializers.json.DjangoJSONEncoder,
                help_text="Cache of the dataset definitions from the current Task branch",
            ),
        ),
        migrations.AddField(
            model_name="scratchorg",
            name="datasets_parse_errors",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="User-facing errors that occurred during dataset refresh",
            ),
        ),
    ]
