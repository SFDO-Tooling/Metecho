import datetime
import logging
from types import SimpleNamespace

from ..logfmt import JobIDFilter, LogfmtFormatter


def test_job_id_filter(mocker):
    get_id = mocker.patch("metecho.logfmt.get_current_job")
    get_id.return_value.id = 123
    log_filter = JobIDFilter()
    record = SimpleNamespace()
    log_filter.filter(record)
    assert record.job_id == 123


def test_job_id_filter__no_job(mocker):
    get_id = mocker.patch("metecho.logfmt.get_current_job")
    get_id.return_value = None
    log_filter = JobIDFilter()
    record = SimpleNamespace()
    log_filter.filter(record)
    assert record.job_id == "no-job-id"


def test_formatter__record_id():
    record = logging.LogRecord(
        "name", logging.INFO, "module", 1, "Some message", (), None
    )
    record.request_id = 123
    result = LogfmtFormatter().format(record)
    assert "id=123" in result


def test_formatter__job_id():
    record = logging.LogRecord(
        "name", logging.INFO, "module", 1, "Some message", (), None
    )
    record.job_id = 321
    result = LogfmtFormatter().format(record)
    assert "id=321" in result


def test_formatter_format():
    record = logging.LogRecord(
        "name", logging.INFO, "module", 1, "Some message", (), None
    )
    time = datetime.datetime.fromtimestamp(record.created).strftime(
        "%Y-%m-%d %H:%M:%S.%f"
    )

    result = LogfmtFormatter().format(record)
    expected = " ".join(
        [
            "id=unknown",
            "at=INFO",
            f'time="{time}"',
            "tag=external",
            "module=module",
            'msg="Some message"',
        ]
    )

    assert result == expected


def test_formatter_format_line():
    extra = {"none": None, "bool": True, "number": 1, "dict": {}}
    result = LogfmtFormatter().format_line(extra)
    expected = 'none= bool=true number=1 dict="{}"'

    assert result == expected


def test_formatter_tag():
    record = logging.LogRecord(
        "name", logging.INFO, "module", 1, "Some message", (), None
    )

    record.tag = "some-tag"

    result = LogfmtFormatter()._get_tag(record)
    expected = '"some-tag"'

    assert result == expected


def test_parsed_msg():
    record = logging.LogRecord(
        "name", logging.INFO, "logging_middleware", 1, "foo=bar baz=qux", (), None
    )
    time = datetime.datetime.fromtimestamp(record.created).strftime(
        "%Y-%m-%d %H:%M:%S.%f"
    )

    result = LogfmtFormatter().format(record)
    expected = " ".join(
        [
            "id=unknown",
            "at=INFO",
            f'time="{time}"',
            "tag=external",
            "module=logging_middleware",
            "foo=bar",
            "baz=qux",
        ]
    )

    assert result == expected
