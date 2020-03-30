#include <stdio.h>
#include <unistd.h>

int main(int argc, char *argv[]) {
    argv[0] = "/usr/local/bin/cci";
    extern char** environ;

    execve(argv[0], argv, environ);
    // execve only returns on error
    return 1;
}
