update-deps:
	pip-compile --upgrade requirements/prod.in
	pip-compile --upgrade requirements/dev.in

dev-install:
	pip-sync requirements/*.txt
