import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function createSuggestionReason(goal: string, recentType: string) {
  const focus = goal || recentType || 'fitness';
  return `This recommendation matches your ${focus} goal and recent ${recentType || 'activity'} pattern.`;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const userId = body.userId;
  const teamId = body.teamId;
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutes = Number(body.minutes);

  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw badRequest('Activity requires valid userId and teamId values.');
  }

  if (!type) {
    throw badRequest('Activity type is required.');
  }

  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Activity minutes must be a positive number.');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);

  if (!user) {
    throw notFound('User not found.');
  }

  if (!team) {
    throw notFound('Team not found.');
  }

  try {
    const activity = await Activity.create({
      user: userId,
      team: teamId,
      type,
      minutes,
      points: minutes,
      occurredAt: new Date(),
    });
    return activity.toObject ? activity.toObject() : activity;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      throw badRequest(error.message);
    }
    throw error;
  }
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';
  const rawMembers = Array.isArray(body.members) ? body.members : [];

  if (!name) {
    throw badRequest('Team name is required.');
  }

  if (!mascot) {
    throw badRequest('Team mascot is required.');
  }

  const members = rawMembers.filter((member): member is string => typeof member === 'string');
  const invalidMember = members.find((member) => !mongoose.isValidObjectId(member));

  if (invalidMember) {
    throw badRequest(`Member ID ${invalidMember} is invalid.`);
  }

  try {
    const team = await Team.create({
      name,
      mascot,
      members: members.map((member) => new mongoose.Types.ObjectId(member)),
    });
    return team.toObject ? team.toObject() : team;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      throw badRequest(error.message);
    }
    throw error;
  }
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const leaderboard = [] as Array<{ teamName: string; totalPoints: number; rank: number }>;

  for (const [index, entry] of totals.entries()) {
    const team = await Team.findById(entry._id).lean();
    if (!team) continue;
    leaderboard.push({
      teamName: team.name,
      totalPoints: Number(entry.totalPoints),
      rank: index + 1,
    });
  }

  return leaderboard;
}

export async function suggestWorkouts(userEmail: string) {
  const email = normalizeEmail(userEmail);
  if (!email) {
    throw badRequest('User email is required.');
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw notFound('User not found.');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentType = recentActivities[0]?.type as string | undefined;
  const fitnessGoal = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.trim().toLowerCase() : '';
  const focus = fitnessGoal || (recentType ? recentType.toLowerCase() : '');

  const matches = focus
    ? await Workout.find({ focus: new RegExp(`^${focus}$`, 'i') }).lean()
    : await Workout.find().lean();

  const fallback = matches.length > 0 ? matches : await Workout.find().lean();
  return fallback.map((workout) => ({
    ...workout,
    reason: createSuggestionReason(fitnessGoal || focus, recentType || 'activity'),
  }));
}

export { User };
