docker build . -t metecho-local
docker tag metecho-local rmasud752/next-gen:qbrix-maker
docker push rmasud752/next-gen:qbrix-maker
