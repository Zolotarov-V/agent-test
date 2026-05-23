from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_userapikey_github_and_allowlist"),
    ]

    operations = [
        migrations.AddField(
            model_name="userapikey",
            name="serper_api_key_encrypted",
            field=models.TextField(blank=True, default=""),
        ),
    ]
