from rest_framework.fields import CharField


class MarkdownField(CharField):
    def to_representation(self, value):
        # This presumes that you are bound to a serializer and have an
        # instance on that serializer, neither of which I like, but it
        # does avoid duplicating the logic in the model MarkdownField.
        # print(">>>>", self.parent.instance)
        parent = (
            self.parent.instance[0]
            if isinstance(self.parent.instance, list)
            else self.parent.instance
        )
        return getattr(parent, self.field_name + "_markdown")
