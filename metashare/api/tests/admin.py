from ..admin import ArrayFieldCheckboxSelectMultiple


class TestArrayFieldCheckboxSelectMultiple:
    def test_format_value(self, mocker):
        csm = mocker.patch("metashare.api.admin.CheckboxSelectMultiple")
        csm.format_value = lambda x: x
        assert ArrayFieldCheckboxSelectMultiple().format_value("some,test") == [
            "some",
            "test",
        ]
