set -e

# make Chrome available to VBT
# Copied from https://github.com/SFDO-Tooling/MetaDeploy/pull/3468
mkdir -p /opt/google/chrome
ln -s /app/.apt/usr/bin/google-chrome /opt/google/chrome/chrome
python manage.py rqworker default
