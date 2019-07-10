from rest_framework.fields import CharField


class MarkdownField(CharField):
    def to_representation(self, value):
        # This presumes that you are bound to a serializer and have an
        # instance on that serializer, neither of which I like, but it
        # does avoid duplicating the logic in the model MarkdownField.
        return getattr(self.parent.instance, self.field_name + "_markdown")
