from rest_framework import serializers


class ChatTurnSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=('user', 'assistant'))
    content = serializers.CharField(max_length=1500, trim_whitespace=True)


class CopilotRequestSerializer(serializers.Serializer):
    class Mode:
        BILLING = 'billing_copilot'
        RENEWAL = 'renewal_insights'
        SUPPORT = 'customer_support'

    mode = serializers.ChoiceField(choices=(Mode.BILLING, Mode.RENEWAL, Mode.SUPPORT))
    question = serializers.CharField(max_length=1000, trim_whitespace=True)
    history = ChatTurnSerializer(many=True, required=False, allow_empty=True, max_length=8)
