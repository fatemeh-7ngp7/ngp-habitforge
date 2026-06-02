"""
Full development data seeder.
Run with: cd backend && poetry run python scripts/seed_data.py

Creates:
- 8 habit categories
- 8 XP levels
- 12 badges
- 3 test users with habits, completions, streaks, friendships
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from datetime import date, timedelta, datetime
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.habits.models import Habit, HabitCompletion, HabitCategory
from apps.gamification.models import Badge, XPLevel
from apps.social.models import Friendship, GroupChallenge, ChallengeParticipant

User = get_user_model()

print("\n🌱 NGP HabitForge — Development Data Seeder")
print("=" * 50)


# ── Categories ────────────────────────────────────────────────────────────────
print("\n📂 Seeding habit categories...")
cats = [
    ("Fitness",    "🏃", "#E8400C", 1), ("Mind",      "🧘", "#9B51E0", 2),
    ("Nutrition",  "🥗", "#27AE60", 3), ("Sleep",     "😴", "#2D9CDB", 4),
    ("Learning",   "📚", "#F2994A", 5), ("Social",    "👥", "#EB5757", 6),
    ("Finance",    "💰", "#56CCF2", 7), ("Creativity", "🎨", "#F2C94C", 8),
]
for name, icon, color, order in cats:
    obj, created = HabitCategory.objects.get_or_create(
        name=name, defaults={"icon": icon, "color": color, "order": order}
    )
    print(f"  {'✅' if created else '⏩'} {icon} {name}")


# ── XP Levels ─────────────────────────────────────────────────────────────────
print("\n⭐ Seeding XP levels...")
levels = [
    (1,0,"Beginner","🌱","#95A5A6"),(2,500,"Bronze","🥉","#CD7F32"),
    (3,1500,"Silver","🥈","#C0C0C0"),(4,3500,"Gold","🥇","#FFD700"),
    (5,7500,"Platinum","💫","#E8E8E8"),(6,15000,"Diamond","💎","#56CCF2"),
    (7,30000,"Elite","⚡","#9B51E0"),(8,60000,"Legend","🔥","#E8400C"),
]
for level, xp, title, icon, color in levels:
    obj, created = XPLevel.objects.get_or_create(
        level=level, defaults={"xp_required":xp,"title":title,"icon":icon,"color":color}
    )
    print(f"  {'✅' if created else '⏩'} Level {level}: {title}")


# ── Badges ────────────────────────────────────────────────────────────────────
print("\n🏆 Seeding badges...")
badges = [
    ("First Step","👣","#27AE60","TOTAL_COMPLETIONS",1,50,"Complete your first habit.",1),
    ("Getting Started","🌱","#27AE60","TOTAL_COMPLETIONS",10,100,"Complete 10 habits.",2),
    ("On a Roll","🎯","#2D9CDB","TOTAL_COMPLETIONS",50,200,"Complete 50 habits.",3),
    ("Century Club","💯","#E8400C","TOTAL_COMPLETIONS",100,500,"Complete 100 habits.",4),
    ("Week Warrior","🔥","#E8400C","STREAK_DAYS",7,150,"Maintain a 7-day streak.",5),
    ("Fortnight Force","⚡","#F2994A","STREAK_DAYS",14,300,"Maintain a 14-day streak.",6),
    ("Monthly Master","🏆","#9B51E0","STREAK_DAYS",30,750,"Maintain a 30-day streak.",7),
    ("Iron Will","💎","#56CCF2","STREAK_DAYS",100,2000,"Maintain a 100-day streak.",8),
    ("Habit Builder","🏗️","#F2994A","HABITS_CREATED",3,75,"Create 3 habits.",9),
    ("Perfect Week","🌟","#F2C94C","PERFECT_WEEK",1,500,"Complete all habits 7 days in a row.",10),
    ("Early Bird","🌅","#F2994A","EARLY_BIRD",5,200,"Complete a habit before 7 AM five times.",11),
    ("Social Butterfly","🦋","#9B51E0","CHALLENGE_JOINED",3,250,"Join 3 group challenges.",12),
]
for name, icon, color, ctype, cval, xp_reward, desc, order in badges:
    obj, created = Badge.objects.get_or_create(
        name=name,
        defaults={"icon":icon,"color":color,"condition_type":ctype,
                  "condition_value":cval,"xp_reward":xp_reward,
                  "description":desc,"order":order}
    )
    print(f"  {'✅' if created else '⏩'} {icon} {name}")


# ── Users ─────────────────────────────────────────────────────────────────────
print("\n👤 Seeding test users...")
users_data = [
    ("alice@ngp.com",  "alice",   "Alice",  "Smith",  "AlicePass123!"),
    ("bob@ngp.com",    "bob",     "Bob",    "Jones",  "BobPass123!"),
    ("charlie@ngp.com","charlie", "Charlie","Brown",  "CharliePass123!"),
]
users = []
for email, username, first, last, pw in users_data:
    user, created = User.objects.get_or_create(
        email=email,
        defaults={"username":username,"first_name":first,"last_name":last}
    )
    if created:
        user.set_password(pw)
        user.save()
    users.append(user)
    print(f"  {'✅' if created else '⏩'} {first} {last} ({email})")


# ── Habits + Completions ──────────────────────────────────────────────────────
print("\n⚡ Seeding habits and completions...")
fitness_cat = HabitCategory.objects.get(name="Fitness")
mind_cat    = HabitCategory.objects.get(name="Mind")

habit_templates = [
    ("Morning Run",  "MEASURABLE", "5.00", "km",  "HARD",   fitness_cat),
    ("Meditation",   "BINARY",     None,   "",    "EASY",   mind_cat),
    ("Deep Work",    "TIME_BASED", "120",  "min", "MEDIUM", mind_cat),
]

today = date.today()

for user in users:
    for title, htype, tval, tunit, diff, cat in habit_templates:
        habit, created = Habit.objects.get_or_create(
            user=user, title=title,
            defaults={
                "habit_type": htype, "target_value": tval,
                "target_unit": tunit, "difficulty": diff,
                "frequency_type": "DAILY", "category": cat,
            }
        )
        if created:
            # Seed 10 days of completions
            for i in range(10, 0, -1):
                day = today - timedelta(days=i)
                if not habit.completions.filter(completed_at__date=day).exists():
                    HabitCompletion.objects.create(
                        habit=habit,
                        completed_at=timezone.make_aware(
                            datetime.combine(day, datetime.min.time()).replace(hour=8)
                        ),
                        value=tval,
                        xp_earned=habit.get_xp_value(),
                    )

print(f"  ✅ {Habit.objects.count()} habits, {HabitCompletion.objects.count()} completions")


# ── Friendships ───────────────────────────────────────────────────────────────
print("\n👥 Seeding friendships...")
alice, bob, charlie = users
pairs = [(alice, bob), (alice, charlie), (bob, charlie)]
for req, addr in pairs:
    f, created = Friendship.objects.get_or_create(
        requester=req, addressee=addr,
        defaults={"status": "ACCEPTED"}
    )
    if not created and f.status != "ACCEPTED":
        f.status = "ACCEPTED"
        f.save()
    print(f"  {'✅' if created else '⏩'} {req.username} ↔ {addr.username}")


# ── Group Challenge ───────────────────────────────────────────────────────────
print("\n🏁 Seeding group challenge...")
challenge, created = GroupChallenge.objects.get_or_create(
    title="30-Day Morning Run Club",
    defaults={
        "created_by":  alice,
        "description": "Run every morning for 30 days!",
        "privacy":     "PUBLIC",
        "habit_type":  "MEASURABLE",
        "target_value": "5.00",
        "target_unit":  "km",
        "start_date":  today,
        "end_date":    today + timedelta(days=30),
    }
)
for user in users:
    ChallengeParticipant.objects.get_or_create(challenge=challenge, user=user)
print(f"  {'✅' if created else '⏩'} {challenge.title} ({challenge.participant_count} participants)")


print("\n" + "=" * 50)
print("✅ Seed complete!")
print(f"   Users:       {User.objects.count()}")
print(f"   Habits:      {Habit.objects.count()}")
print(f"   Completions: {HabitCompletion.objects.count()}")
print(f"   Badges:      {Badge.objects.count()}")
print(f"   XP Levels:   {XPLevel.objects.count()}")
print(f"   Friendships: {Friendship.objects.count()}")
print(f"   Challenges:  {GroupChallenge.objects.count()}")
print()
