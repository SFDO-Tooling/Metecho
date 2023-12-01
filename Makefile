.PHONY: clean clean-test clean-pyc clean-build docs help
.DEFAULT_GOAL := help
CLASS_PATH = metecho
define BROWSER_PYSCRIPT
import os, webbrowser, sys
try:
	from urllib import pathname2url
except:
	from urllib.request import pathname2url

webbrowser.open("file://" + pathname2url(os.path.abspath(sys.argv[1])))
endef
export BROWSER_PYSCRIPT
BROWSER := python -c "$$BROWSER_PYSCRIPT"

clean-test:
	rm -rf .tox/
	rm -f .coverage
	rm -rf htmlcov/
	rm -f output.xml
	rm -f report.html

test:
	pytest

# Use CLASS_PATH to run coverage for a subset of tests.
# $ make coverage CLASS_PATH="cumulusci/core/tests"
coverage: clean-test
	coverage run --source $(CLASS_PATH) -m pytest $(CLASS_PATH)

update-deps:
	pip-compile --upgrade requirements/prod.in -o requirements/prod.txt
	pip-compile --upgrade requirements/dev.in -o requirements/dev.txt

update-deps-cci:
	pip-compile -P cumulusci requirements/prod.in -o requirements/prod.txt
	pip-compile -P cumulusci requirements/dev.in -o requirements/dev.txt

dev-install:
	pip install pip-tools
	pip-sync requirements/*.txt
