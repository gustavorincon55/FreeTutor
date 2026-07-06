import json
from datetime import datetime

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.db.models import Q
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Availability, Post, Profile, Session


def _profile_data(request, profile):
    return {
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email,
        'bio': profile.bio or '',
        'is_tutor': profile.is_tutor,
        'is_learner': profile.is_learner,
        'tutor_subjects': profile.tutor_subjects,
        'learner_subjects': profile.learner_subjects,
        'photo': profile.photo or None,
        'timezone': profile.timezone,
    }


def _serialize_avail(avail):
    return {
        'id': avail.id,
        'role': avail.role,
        'topic': avail.topic,
        'time_windows': avail.time_windows,
        'created_at': avail.created_at.isoformat(),
    }


def _serialize_session(s):
    return {
        'id': s.id,
        'tutor': {'id': s.tutor.id, 'username': s.tutor.username} if s.tutor else None,
        'learner': {'id': s.learner.id, 'username': s.learner.username},
        'topic': s.topic,
        'day': s.day,
        'start_time': str(s.start_time)[:5],
        'end_time': str(s.end_time)[:5],
        'status': s.status,
        'post_id': s.post_id,
        'created_at': s.created_at.isoformat(),
    }


def _tutor_covers_session(tutor_user, session):
    """Check if a tutor has availability covering the session's topic/day/time."""
    avails = Availability.objects.filter(
        user=tutor_user, role='tutor', topic__iexact=session.topic
    )
    slot_start = session.start_time.strftime('%H:%M')
    slot_end = session.end_time.strftime('%H:%M')
    for avail in avails:
        for w in avail.time_windows:
            if w['day'] == session.day and w['start'] <= slot_start and w['end'] >= slot_end:
                return True
    return False


def _all_hour_slots(time_windows):
    """Generate all 1-hour (day, start, end) tuples from a list of time windows."""
    slots = set()
    for w in time_windows:
        sh, sm = map(int, w['start'].split(':'))
        eh, em = map(int, w['end'].split(':'))
        cur = sh * 60 + sm
        end = eh * 60 + em
        while cur + 60 <= end:
            s = f'{cur // 60:02d}:{cur % 60:02d}'
            e = f'{(cur + 60) // 60:02d}:{(cur + 60) % 60:02d}'
            slots.add((w['day'], s, e))
            cur += 60
    return slots


def _tutor_has_free_slots(tutor_user, topic):
    """Return True if the tutor still has any unbooked 1-hour availability slot for topic."""
    avails = Availability.objects.filter(user=tutor_user, role='tutor', topic__iexact=topic)
    all_slots = set()
    for a in avails:
        all_slots |= _all_hour_slots(a.time_windows)
    if not all_slots:
        return False
    confirmed = Session.objects.filter(
        tutor=tutor_user, topic__iexact=topic, status='confirmed'
    )
    booked = {(s.day, str(s.start_time)[:5], str(s.end_time)[:5]) for s in confirmed}
    return bool(all_slots - booked)


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token(request):
    return Response({'csrfToken': get_token(request)})


@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    Profile.objects.create(user=user)
    login(request, user)
    return Response({'message': 'Account created successfully.', 'username': username}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get('username', '')
    password = request.data.get('password', '')

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({'message': f'Welcome back, {username}!', 'username': username})
    return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout_api(request):
    logout(request)
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET', 'PATCH'])
def profile_api(request):
    try:
        profile = Profile.objects.get(user=request.user)
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=request.user)

    if request.method == 'GET':
        return Response(_profile_data(request, profile))

    if 'bio' in request.data:
        profile.bio = request.data['bio']
    if 'is_tutor' in request.data:
        profile.is_tutor = request.data['is_tutor'] in [True, 'true', 'True', '1']
    if 'is_learner' in request.data:
        profile.is_learner = request.data['is_learner'] in [True, 'true', 'True', '1']
    if 'tutor_subjects' in request.data:
        val = request.data['tutor_subjects']
        profile.tutor_subjects = json.loads(val) if isinstance(val, str) else val
    if 'learner_subjects' in request.data:
        val = request.data['learner_subjects']
        profile.learner_subjects = json.loads(val) if isinstance(val, str) else val
    if 'timezone' in request.data:
        profile.timezone = request.data['timezone']
    if 'photo' in request.FILES:
        import base64
        f = request.FILES['photo']
        if f.size > 5 * 1024 * 1024:
            return Response({'error': 'Photo must be under 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)
        mime = f.content_type or 'image/jpeg'
        data = base64.b64encode(f.read()).decode('utf-8')
        profile.photo = f'data:{mime};base64,{data}'
    profile.save()
    return Response(_profile_data(request, profile))


@api_view(['GET', 'POST'])
def availability_list_api(request):
    if request.method == 'GET':
        entries = Availability.objects.filter(user=request.user).order_by('-created_at')
        return Response([_serialize_avail(e) for e in entries])

    role = request.data.get('role')
    topic = request.data.get('topic', '').strip()
    time_windows = request.data.get('time_windows', [])

    if role not in ('tutor', 'learner'):
        return Response({'error': 'role must be tutor or learner.'}, status=status.HTTP_400_BAD_REQUEST)
    if not topic:
        return Response({'error': 'topic is required.'}, status=status.HTTP_400_BAD_REQUEST)

    avail = Availability.objects.create(
        user=request.user, role=role, topic=topic.lower(), time_windows=time_windows
    )
    return Response(_serialize_avail(avail), status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
def availability_detail_api(request, pk):
    try:
        avail = Availability.objects.get(pk=pk, user=request.user)
    except Availability.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(_serialize_avail(avail))

    if request.method == 'PUT':
        avail.role = request.data.get('role', avail.role)
        avail.topic = request.data.get('topic', avail.topic).strip()
        avail.time_windows = request.data.get('time_windows', avail.time_windows)
        avail.save()
        return Response(_serialize_avail(avail))

    avail.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def sessions_api(request):
    my_sessions = Session.objects.filter(
        Q(tutor=request.user) | Q(learner=request.user)
    ).exclude(status='cancelled').order_by('-created_at')
    return Response([_serialize_session(s) for s in my_sessions])


@api_view(['GET'])
def open_sessions_api(request):
    """Open sessions matching the current user's tutor availability (for tutors to browse and accept)."""
    topic = request.query_params.get('topic', '').strip()

    avail_qs = Availability.objects.filter(user=request.user, role='tutor')
    if topic:
        avail_qs = avail_qs.filter(topic__iexact=topic)

    open_sessions = Session.objects.filter(status='open').exclude(learner=request.user).select_related('learner', 'post')

    matching = []
    seen = set()
    for session in open_sessions:
        if session.id in seen:
            continue
        if _tutor_covers_session(request.user, session):
            matching.append(session)
            seen.add(session.id)

    return Response([_serialize_session(s) for s in matching])


@api_view(['POST'])
def session_action_api(request, pk):
    try:
        session = Session.objects.get(pk=pk)
    except Session.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')

    # Tutor confirms a pending_tutor session (learner connected to their offer)
    if action == 'confirm' and session.status == 'pending_tutor':
        if session.tutor != request.user:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        session.status = 'confirmed'

    # Tutor accepts an open request
    elif action == 'accept':
        if session.status != 'open':
            return Response({'error': 'Session is not open.'}, status=status.HTTP_400_BAD_REQUEST)
        if session.learner == request.user:
            return Response({'error': 'You cannot accept your own request.'}, status=status.HTTP_400_BAD_REQUEST)
        if not _tutor_covers_session(request.user, session):
            return Response({'error': 'Your availability does not cover this slot.'}, status=status.HTTP_400_BAD_REQUEST)
        session.tutor = request.user
        session.status = 'pending_learner'

    # Learner confirms after tutor accepted
    elif action == 'confirm':
        if session.learner != request.user:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        if session.status != 'pending_learner':
            return Response({'error': 'Session is not pending your confirmation.'}, status=status.HTTP_400_BAD_REQUEST)
        session.status = 'confirmed'

    # Learner rejects → cancelled (removes from both parties' session views)
    elif action == 'reject':
        if session.learner != request.user:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        if session.status != 'pending_learner':
            return Response({'error': 'Nothing to reject.'}, status=status.HTTP_400_BAD_REQUEST)
        session.status = 'cancelled'

    # Either party cancels
    elif action == 'cancel':
        if session.tutor != request.user and session.learner != request.user:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        session.status = 'cancelled'

    else:
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

    session.save()
    return Response(_serialize_session(session))


def _post_overlap_windows(post, viewer):
    """
    For offer posts: return the post's predefined time_slots not yet confirmed between this pair.
    Any learner can connect to a tutor's offered slots — no need to check learner's availability.
    For request posts: return the post's predefined time_slots that match the viewer's tutor availability
    and are not already confirmed between this pair.
    """
    if post.user == viewer:
        return []
    if not post.time_slots:
        return []

    tutor = post.user if post.type == 'offer' else viewer
    learner = viewer if post.type == 'offer' else post.user
    confirmed_sessions = Session.objects.filter(
        tutor=tutor, learner=learner, topic__iexact=post.topic, status='confirmed'
    )
    confirmed_slots = {(s.day, str(s.start_time)[:5], str(s.end_time)[:5]) for s in confirmed_sessions}

    viewer_role = 'learner' if post.type == 'offer' else 'tutor'
    viewer_avails = Availability.objects.filter(
        user=viewer, role=viewer_role, topic__iexact=post.topic
    )
    if not viewer_avails.exists():
        return []
    viewer_slots = set()
    for va in viewer_avails:
        viewer_slots |= _all_hour_slots(va.time_windows)

    return [
        s for s in post.time_slots
        if (s['day'], s['start'], s['end']) in viewer_slots
        and (s['day'], s['start'], s['end']) not in confirmed_slots
    ]


def _serialize_post(post, requesting_user):
    overlaps = _post_overlap_windows(post, requesting_user)

    # Show active sessions for both post types (open/pending visible to relevant parties)
    sessions_data = []
    for s in post.sessions.exclude(status__in=['confirmed', 'cancelled']):
        can_accept = (
            s.status == 'open'
            and requesting_user != post.user
            and _tutor_covers_session(requesting_user, s)
        )
        sessions_data.append({
            **_serialize_session(s),
            'can_accept': can_accept,
        })

    return {
        'id': post.id,
        'type': post.type,
        'topic': post.topic,
        'notes': post.notes,
        'time_slots': post.time_slots,
        'created_at': post.created_at.isoformat(),
        'is_mine': post.user == requesting_user,
        'can_connect': len(overlaps) > 0,
        'overlap_windows': overlaps,
        'sessions': sessions_data,
        'user': {
            'username': post.user.username,
            'is_tutor': post.user.profile.is_tutor if hasattr(post.user, 'profile') else False,
            'is_learner': post.user.profile.is_learner if hasattr(post.user, 'profile') else False,
        },
    }


@api_view(['GET', 'POST'])
def post_list_api(request):
    if request.method == 'GET':
        filter_type = request.query_params.get('type')
        filter_topic = request.query_params.get('topic', '').strip()
        filter_author = request.query_params.get('author', '').strip()
        posts = Post.objects.select_related('user__profile').prefetch_related('sessions').all()
        if filter_type in ('offer', 'request'):
            posts = posts.filter(type=filter_type)
        if filter_topic:
            posts = posts.filter(topic__icontains=filter_topic)
        if filter_author:
            posts = posts.filter(user__username__icontains=filter_author)

        result = []
        for post in posts:
            is_mine = post.user == request.user

            # Hide posts whose predefined slots are all confirmed/cancelled
            if post.time_slots:
                confirmed_keys = {
                    (s.day, str(s.start_time)[:5], str(s.end_time)[:5])
                    for s in post.sessions.filter(status='confirmed')
                }
                post_keys = {(s['day'], s['start'], s['end']) for s in post.time_slots}
                has_active = post.sessions.exclude(status__in=['confirmed', 'cancelled']).exists()
                if post_keys and post_keys <= confirmed_keys and not has_active:
                    continue

            if not is_mine:
                # Hide if the user has a cancelled session on this post (rejected or cancelled by either party)
                if post.sessions.filter(
                    Q(tutor=request.user) | Q(learner=request.user),
                    status='cancelled'
                ).exists():
                    continue

                # Hide if user has no matching availability/topic
                overlaps = _post_overlap_windows(post, request.user)
                if not overlaps:
                    continue

            result.append(post)

        return Response([_serialize_post(p, request.user) for p in result])

    post_type = request.data.get('type')
    topic = request.data.get('topic', '').strip()
    notes = request.data.get('notes', '').strip()
    time_slots = request.data.get('time_slots', [])  # [{day, start, end}]

    if post_type not in ('offer', 'request'):
        return Response({'error': 'type must be offer or request.'}, status=status.HTTP_400_BAD_REQUEST)
    if not topic:
        return Response({'error': 'topic is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not time_slots:
        return Response({'error': 'Select at least one time slot.'}, status=status.HTTP_400_BAD_REQUEST)

    slot_keys = {(s['day'], s['start'], s['end']) for s in time_slots}

    # Rule 1: no confirmed session already occupies any of these slots
    for s in Session.objects.filter(
        Q(tutor=request.user) | Q(learner=request.user),
        topic__iexact=topic, status='confirmed'
    ):
        key = (s.day, str(s.start_time)[:5], str(s.end_time)[:5])
        if key in slot_keys:
            return Response(
                {'error': f'You already have a confirmed session on {s.day} {str(s.start_time)[:5]}–{str(s.end_time)[:5]}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Rule 2: no existing active post already claims any of these slots
    for existing in Post.objects.filter(user=request.user, topic__iexact=topic, type=post_type):
        for slot in existing.time_slots:
            key = (slot['day'], slot['start'], slot['end'])
            if key not in slot_keys:
                continue
            if post_type == 'request':
                if existing.sessions.exclude(status='cancelled').filter(
                    day=slot['day'], start_time=slot['start'], end_time=slot['end']
                ).exists():
                    return Response(
                        {'error': f'You already have an active post for {slot["day"]} {slot["start"]}–{slot["end"]}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {'error': f'You already have an offer for {slot["day"]} {slot["start"]}–{slot["end"]}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

    post = Post.objects.create(user=request.user, type=post_type, topic=topic, notes=notes, time_slots=time_slots)

    if post_type == 'request':
        for slot in time_slots:
            Session.objects.create(
                learner=request.user,
                tutor=None,
                topic=topic,
                day=slot['day'],
                start_time=slot['start'],
                end_time=slot['end'],
                status='open',
                post=post,
            )

    return Response(_serialize_post(post, request.user), status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def post_detail_api(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if post.user != request.user:
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    post.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def post_connect_api(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    allowed_overlaps = _post_overlap_windows(post, request.user)
    if not allowed_overlaps:
        return Response({'error': 'No matching availability.'}, status=status.HTTP_400_BAD_REQUEST)

    # If the frontend passed a specific subset of slots, honour that selection
    requested_slots = request.data.get('slots', [])
    if requested_slots:
        allowed_keys = {(s['day'], s['start'], s['end']) for s in allowed_overlaps}
        overlaps = [s for s in requested_slots if (s['day'], s['start'], s['end']) in allowed_keys]
    else:
        overlaps = allowed_overlaps

    if not overlaps:
        return Response({'error': 'None of the selected slots match your availability.'}, status=status.HTTP_400_BAD_REQUEST)

    tutor = post.user if post.type == 'offer' else request.user
    learner = request.user if post.type == 'offer' else post.user

    sessions = []
    for w in overlaps:
        # Skip if an active (non-cancelled) session already exists for this slot
        active = Session.objects.filter(
            tutor=tutor, learner=learner, topic=post.topic,
            day=w['day'], start_time=w['start'], end_time=w['end'],
        ).exclude(status='cancelled').first()
        if active:
            continue
        try:
            session = Session.objects.create(
                tutor=tutor, learner=learner, topic=post.topic,
                day=w['day'], start_time=w['start'], end_time=w['end'],
                status='pending_tutor', post=post,
            )
            sessions.append(_serialize_session(session))
        except IntegrityError:
            pass

    return Response({'sessions': sessions, 'count': len(sessions)}, status=status.HTTP_201_CREATED)
