# Generated by Django 3.1.7 on 2021-04-12 21:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0096_merge_20210224_1518"),
    ]

    operations = [
        migrations.AddField(
            model_name="githubrepository",
            name="permissions",
            field=models.JSONField(null=True),
        ),
    ]
