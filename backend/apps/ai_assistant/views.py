import logging

from django.conf import settings
from openai import APIError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .context import build_context
from .serializers import CopilotRequestSerializer
from .service import MODE_INSTRUCTIONS, generate_copilot_answer

logger = logging.getLogger(__name__)


class CopilotView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai_assistant'

    def post(self, request):
        serializer = CopilotRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        mode = payload['mode']

        if mode not in MODE_INSTRUCTIONS:
            return Response({'error': 'Unsupported AI mode.'}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.OPENAI_API_KEY:
            return Response(
                {'error': 'AI is not configured yet. Add OPENAI_API_KEY to the backend environment.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            context = build_context(request.user, mode)
        except PermissionDenied as exc:
            return Response({'error': str(exc.detail)}, status=status.HTTP_403_FORBIDDEN)

        try:
            answer = generate_copilot_answer(
                mode=mode,
                question=payload['question'],
                history=payload.get('history', []),
                context=context,
            )
        except APIError as exc:
            logger.warning(
                'OpenAI copilot request failed for user_id=%s mode=%s error_type=%s',
                request.user.pk,
                mode,
                type(exc).__name__,
            )
            return Response(
                {'error': 'The AI assistant is temporarily unavailable. Please try again shortly.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not answer:
            return Response(
                {'error': 'The AI assistant returned an empty answer. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({
            'mode': mode,
            'answer': answer,
            'as_of': context['as_of'],
            'currency': context['currency'],
        })
