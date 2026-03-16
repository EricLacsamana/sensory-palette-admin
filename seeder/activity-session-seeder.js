import axios from 'axios';
import { faker } from '@faker-js/faker';

// --- CONFIGURATION ---
const STRAPI_URL = 'http://127.0.0.1:1337';
const CREDENTIALS = {
    identifier: 'therapist', // Must exist in your Strapi DB
    password: 'password123',
};

// --- THE COMPLETE GAME DATASETS ---
const ALL_MATH = [
    {
        prompt: '1 + 1',
        answer: '2',
        soundsLike: ['two', 'too', 'to'],
        level: 1,
    },
    { prompt: '2 + 1', answer: '3', soundsLike: ['three', 'tree'], level: 1 },
    { prompt: '2 + 2', answer: '4', soundsLike: ['four', 'for'], level: 2 },
    { prompt: '3 + 2', answer: '5', soundsLike: ['five', 'hive'], level: 2 },
    { prompt: '3 + 3', answer: '6', soundsLike: ['six', 'sticks'], level: 3 },
    { prompt: '4 + 4', answer: '8', soundsLike: ['eight', 'ate'], level: 3 },
    {
        prompt: '2 - 1',
        answer: '1',
        soundsLike: ['one', 'won', 'sun'],
        level: 4,
    },
    {
        prompt: '3 - 1',
        answer: '2',
        soundsLike: ['two', 'too', 'to'],
        level: 4,
    },
    {
        prompt: '4 - 2',
        answer: '2',
        soundsLike: ['two', 'too', 'to'],
        level: 5,
    },
    { prompt: '5 - 2', answer: '3', soundsLike: ['three', 'tree'], level: 5 },
];

const ALL_ALPHABET = [
    { prompt: 'A', answer: 'a', soundsLike: ['ay', 'hey', 'a'], level: 1 },
    { prompt: 'B', answer: 'b', soundsLike: ['bee', 'be', 'b'], level: 1 },
    { prompt: 'C', answer: 'c', soundsLike: ['see', 'sea', 'c'], level: 1 },
    { prompt: 'D', answer: 'd', soundsLike: ['dee', 'd'], level: 1 },
    { prompt: 'E', answer: 'e', soundsLike: ['ee', 'e'], level: 1 },
    { prompt: 'F', answer: 'f', soundsLike: ['ef', 'eff', 'f'], level: 2 },
    { prompt: 'G', answer: 'g', soundsLike: ['jee', 'g'], level: 2 },
    {
        prompt: 'H',
        answer: 'h',
        soundsLike: ['aitch', 'eightch', 'h'],
        level: 2,
    },
    { prompt: 'K', answer: 'k', soundsLike: ['kay', 'k'], level: 3 },
    { prompt: 'O', answer: 'o', soundsLike: ['oh', 'owe', 'o'], level: 3 },
];

const ALL_WORDS = [
    {
        word: 'Apple',
        emoji: '🍎',
        soundsLike: ['aple', 'abel', 'appul'],
        level: 1,
    },
    { word: 'Dog', emoji: '🐶', soundsLike: ['gog', 'dod', 'dawg'], level: 1 },
    { word: 'Banana', emoji: '🍌', soundsLike: ['nana', 'bana'], level: 2 },
    { word: 'Monkey', emoji: '🐵', soundsLike: ['munky', 'monkee'], level: 2 },
    {
        word: 'Dinosaur',
        emoji: '🦖',
        soundsLike: ['dinasor', 'dynosore'],
        level: 3,
    },
    {
        word: 'Elephant',
        emoji: '🐘',
        soundsLike: ['efant', 'elphant'],
        level: 3,
    },
    {
        word: 'Helicopter',
        emoji: '🚁',
        soundsLike: ['heycopter', 'hellocopter'],
        level: 4,
    },
    {
        word: 'Watermelon',
        emoji: '🍉',
        soundsLike: ['wadermelon', 'watermelen'],
        level: 5,
    },
];

const ALL_OPPOSITES = [
    {
        prompt: 'Day',
        promptEmoji: '☀️',
        answer: 'Night',
        answerEmoji: '🌙',
        soundsLike: ['nite', 'knight'],
        level: 1,
    },
    {
        prompt: 'Happy',
        promptEmoji: '😊',
        answer: 'Sad',
        answerEmoji: '😢',
        soundsLike: ['sat', 'bad'],
        level: 1,
    },
    {
        prompt: 'Fast',
        promptEmoji: '🐆',
        answer: 'Slow',
        answerEmoji: '🐢',
        soundsLike: ['flow', 'snow', 'low'],
        level: 2,
    },
    {
        prompt: 'Heavy',
        promptEmoji: '🪨',
        answer: 'Light',
        answerEmoji: '🪶',
        soundsLike: ['lite', 'right', 'white'],
        level: 3,
    },
    {
        prompt: 'Asleep',
        promptEmoji: '😴',
        answer: 'Awake',
        answerEmoji: '😳',
        soundsLike: ['a wake', 'wait'],
        level: 4,
    },
    {
        prompt: 'Inside',
        promptEmoji: '🏠',
        answer: 'Outside',
        answerEmoji: '🏕️',
        soundsLike: ['out side', 'out'],
        level: 5,
    },
];

const ALL_COLORS = [
    { name: 'Red', hex: '#F43F5E' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Teal', hex: '#06B6D4' },
    { name: 'Orange', hex: '#F97316' },
];

const ALL_SHAPES = [
    { name: 'Circle' },
    { name: 'Square' },
    { name: 'Triangle' },
    { name: 'Heart' },
    { name: 'Star' },
    { name: 'Diamond' },
    { name: 'Hexagon' },
    { name: 'Octagon' },
];

const ALL_ANIMALS = [
    { name: 'Dog', emoji: '🐶' },
    { name: 'Cat', emoji: '🐱' },
    { name: 'Cow', emoji: '🐮' },
    { name: 'Sheep', emoji: '🐑' },
    { name: 'Horse', emoji: '🐴' },
    { name: 'Lion', emoji: '🦁' },
    { name: 'Monkey', emoji: '🐵' },
    { name: 'Rooster', emoji: '🐓' },
];

// --- TELEMETRY ENGINE ---
function generateTelemetry(activityId, rounds, sessionStartTime) {
    const telemetry = [];
    let correct = 0;
    let currentLevel = 1;
    let currentEventTime = new Date(sessionStartTime).getTime();

    for (let i = 0; i < rounds; i++) {
        // Base success rate increases as they play more (simulating learning)
        const isCorrect = Math.random() > 0.25 - i * 0.01;
        if (isCorrect) {
            correct++;
            if (correct % 3 === 0 && currentLevel < 5) currentLevel++;
        }

        const responseTimeMs = faker.number.int({ min: 1100, max: 4800 });
        currentEventTime += responseTimeMs + 2000; // Add response time + 2s pause
        const timestamp = new Date(currentEventTime).toISOString();

        let event = {
            timestamp,
            isCorrect,
            responseTimeMs,
            metadata: {
                currentLevel,
                adaptiveMode: true,
                resultType: isCorrect ? 'correct' : 'wrong',
            },
        };

        // Determine specific dataset based on Strapi Activity ID
        switch (activityId) {
            case 'math-speed':
            case 'math-speak': {
                const pool = ALL_MATH.filter((d) => d.level === currentLevel);
                const item = faker.helpers.arrayElement(
                    pool.length ? pool : ALL_MATH,
                );
                event.action =
                    activityId === 'math-speak' ? 'voice_input' : 'tap';
                event.targetId = item.prompt;
                event.metadata.wordHeard = isCorrect
                    ? item.answer
                    : faker.helpers.arrayElement(item.soundsLike);
                event.metadata.expectedAnswer = item.answer;
                break;
            }
            case 'alphabet-phonics': {
                const pool = ALL_ALPHABET.filter(
                    (d) => d.level === currentLevel,
                );
                const item = faker.helpers.arrayElement(
                    pool.length ? pool : ALL_ALPHABET,
                );
                event.action = 'voice_input';
                event.targetId = item.prompt;
                event.metadata.wordHeard = isCorrect
                    ? item.answer
                    : faker.helpers.arrayElement(item.soundsLike);
                break;
            }
            case 'vocabulary-match': {
                const pool = ALL_WORDS.filter((d) => d.level === currentLevel);
                const item = faker.helpers.arrayElement(
                    pool.length ? pool : ALL_WORDS,
                );
                event.action = 'voice_input';
                event.targetId = item.emoji;
                event.metadata.wordHeard = isCorrect
                    ? item.word
                    : faker.helpers.arrayElement(item.soundsLike);
                break;
            }
            case 'opposites': {
                const pool = ALL_OPPOSITES.filter(
                    (d) => d.level === currentLevel,
                );
                const item = faker.helpers.arrayElement(
                    pool.length ? pool : ALL_OPPOSITES,
                );
                event.action = 'voice_input';
                event.targetId = item.promptEmoji;
                event.metadata.wordHeard = isCorrect
                    ? item.answer
                    : faker.helpers.arrayElement(item.soundsLike);
                break;
            }
            case 'color-match':
            case 'color-match-mobile': {
                const item = faker.helpers.arrayElement(ALL_COLORS);
                event.action = 'tap';
                event.targetId = item.name;
                event.metadata.colorHex = item.hex;
                break;
            }
            case 'shape-match': {
                const item = faker.helpers.arrayElement(ALL_SHAPES);
                event.action = 'tap';
                event.targetId = item.name;
                break;
            }
            case 'wild-echoes':
            case 'sound-scape': {
                const item = faker.helpers.arrayElement(ALL_ANIMALS);
                event.action = 'tap';
                event.targetId = item.name;
                event.metadata.emoji = item.emoji;
                break;
            }
            case 'zumba': {
                event.action = 'movement_detected';
                event.targetId = 'Zumba Routine';
                event.isCorrect = true; // Participation based
                event.metadata = {
                    intensity: faker.helpers.arrayElement([
                        'low',
                        'medium',
                        'high',
                    ]),
                    bpm: faker.number.int({ min: 110, max: 150 }),
                };
                correct++;
                break;
            }
            default: {
                // Fallback for visual/memory games
                event.action = 'interaction';
                event.targetId = `Level ${currentLevel} Item`;
                event.metadata.wordHeard = isCorrect ? 'success' : 'miss';
                break;
            }
        }

        telemetry.push(event);
    }

    return {
        telemetry,
        correct,
        finalLevel: currentLevel,
        sessionEndTime: new Date(currentEventTime),
    };
}

// --- MAIN RUNNER ---
async function run() {
    try {
        console.log('🔐 Logging in as therapist...');

        const authRes = await axios.post(
            `${STRAPI_URL}/api/auth/local`,
            CREDENTIALS,
        );
        const jwt = authRes.data.jwt;
        const therapist = authRes.data.user;

        console.log(`✅ Logged in successfully! (ID: ${therapist.id})`);

        const http = axios.create({
            baseURL: STRAPI_URL,
            headers: {
                Authorization: `Bearer ${jwt}`,
                'Content-Type': 'application/json',
            },
        });

        // Fetch Students
        const studentsRes = await http.get(
            `/api/users?filters[therapist][id][$eq]=${therapist.id}`,
        );
        let students = studentsRes.data;

        if (!students || students.length === 0) {
            console.log(
                '⚠️ No students found. Registering 2 dummy students linked to this therapist...',
            );
            for (let i = 1; i <= 2; i++) {
                const newStudent = await http.post('/api/auth/local/register', {
                    username: `student_${faker.string.numeric(4)}`,
                    email: faker.internet.email(),
                    password: 'password123',
                    therapist: therapist.id,
                });
                students.push(newStudent.data.user);
            }
            console.log('✅ Created dummy students.');
        }

        // Fetch Activities
        const activitiesRes = await http.get('/api/activities');
        const activities = activitiesRes.data.data;

        if (!activities || activities.length === 0) {
            throw new Error('No activities found in the database.');
        }

        // Populate Data Chronologically
        for (const student of students) {
            console.log(`\n👨‍🎓 Processing Student: ${student.username}`);

            for (const act of activities) {
                const slug = act.activityId || 'generic';
                // Only generate full rounds for active games/activities
                if (act.activityStatus === 'disabled') continue;

                const numSessions = faker.number.int({ min: 4, max: 7 });

                // Start date: Randomly sometime in early January 2026
                let sessionDate = new Date(
                    `2026-01-0${faker.number.int({ min: 1, max: 9 })}T10:00:00Z`,
                );

                for (let s = 1; s <= numSessions; s++) {
                    const daysToAdd = faker.number.int({ min: 2, max: 6 });
                    sessionDate = new Date(
                        sessionDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
                    );
                    sessionDate.setUTCHours(
                        faker.number.int({ min: 9, max: 16 }),
                        faker.number.int({ min: 0, max: 59 }),
                        0,
                    );

                    const rounds =
                        slug === 'zumba'
                            ? 1
                            : faker.number.int({ min: 10, max: 15 });
                    const { telemetry, correct, finalLevel, sessionEndTime } =
                        generateTelemetry(slug, rounds, sessionDate);
                    const accuracy = Math.round((correct / rounds) * 100);

                    const clinicalNote =
                        slug === 'zumba'
                            ? `Great physical participation. Maintained elevated heart rate.`
                            : `Session ${s}/${numSessions}: Achieved level ${finalLevel}. Accuracy: ${accuracy}%.`;

                    await http.post('/api/activity-sessions', {
                        data: {
                            sessionId: faker.string.uuid(),
                            activitySessionStatus: 'completed',
                            activity: act.documentId, // Use documentId for Strapi v5 relations
                            therapist: therapist.id,
                            student: student.id,
                            startAt: sessionDate.toISOString(),
                            endAt: sessionEndTime.toISOString(),
                            actualStartAt: sessionDate.toISOString(),
                            actualEndAt: sessionEndTime.toISOString(),
                            rounds: rounds,
                            score: correct,
                            accuracy: accuracy,
                            rawTelemetry: telemetry,
                            enableAdaptiveDifficulty: true,
                            isHandsFree:
                                slug.includes('speak') ||
                                slug.includes('phonics') ||
                                slug.includes('vocabulary') ||
                                slug.includes('opposites'),
                            teacherNotes: clinicalNote,
                            aiRecommendation: `Student requires continued practice on Level ${finalLevel} items.`,
                        },
                    });
                }
                console.log(
                    `  📅 Added ${numSessions} sessions for: ${act.name} (${slug})`,
                );
            }
        }

        console.log(
            '\n✨ DONE: Extremely realistic, game-accurate telemetry generated!',
        );
    } catch (err) {
        if (err.response?.status === 403) {
            console.error(
                "❌ 403 Forbidden: Go to Strapi Admin > Settings > Roles > Authenticated. Check 'create' for activity-sessions and 'find' for users/activities.",
            );
        } else if (err.code === 'ECONNREFUSED') {
            console.error(
                '❌ Connection Refused: Ensure your Strapi server is running (npm run develop).',
            );
        } else {
            console.error(
                '❌ Error:',
                err.response?.data?.error?.message || err.message,
            );
        }
    }
}

run();
