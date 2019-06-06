FROM busybox:latest

ENTRYPOINT sh -c "cd /tmp/hooks && ls | xargs chmod +x && cd /tmp/.git/hooks && find ../../hooks -type f -exec ln -sf {} /tmp/.git/hooks/ \; && echo 'githooks installed'"
