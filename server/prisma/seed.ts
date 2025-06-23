import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.file.deleteMany();
  await prisma.task.deleteMany();
  await prisma.noteUser.deleteMany();
  await prisma.note.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: hashedPassword,
      name: 'John Doe',
      avatar: null,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password: hashedPassword,
      name: 'Jane Smith',
      avatar: null,
    },
  });

  console.log('Created test users');

  // Create test notes
  const note1 = await prisma.note.create({
    data: {
      title: 'プロジェクト企画書',
      content: '# プロジェクト概要\n\n新しいToDoアプリの開発プロジェクトです。\n\n## 目標\n- シンプルで使いやすいUI\n- リアルタイム同期\n- マルチデバイス対応',
      authorId: user1.id,
    },
  });

  const note2 = await prisma.note.create({
    data: {
      title: '週次ミーティング',
      content: '# 週次ミーティング議事録\n\n## 議題\n1. 進捗確認\n2. 課題共有\n3. 来週の計画',
      authorId: user2.id,
    },
  });

  console.log('Created test notes');

  // Add users to notes
  await prisma.noteUser.create({
    data: {
      noteId: note1.id,
      userId: user1.id,
      role: 'admin',
    },
  });

  await prisma.noteUser.create({
    data: {
      noteId: note1.id,
      userId: user2.id,
      role: 'editor',
    },
  });

  await prisma.noteUser.create({
    data: {
      noteId: note2.id,
      userId: user2.id,
      role: 'admin',
    },
  });

  await prisma.noteUser.create({
    data: {
      noteId: note2.id,
      userId: user1.id,
      role: 'viewer',
    },
  });

  console.log('Added users to notes');

  // Create test tasks
  await prisma.task.create({
    data: {
      title: '要件定義書作成',
      description: '詳細な要件定義書を作成する',
      status: 'pending',
      priority: 'high',
      dueDate: new Date('2024-02-15'),
      noteId: note1.id,
      assigneeId: user1.id,
      authorId: user1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'UI設計',
      description: 'ワイヤーフレームとモックアップの作成',
      status: 'in_progress',
      priority: 'medium',
      dueDate: new Date('2024-02-20'),
      noteId: note1.id,
      assigneeId: user2.id,
      authorId: user1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'データベース設計',
      description: 'テーブル設計とER図の作成',
      status: 'completed',
      priority: 'high',
      dueDate: new Date('2024-02-10'),
      noteId: note1.id,
      assigneeId: user1.id,
      authorId: user2.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'ミーティング資料準備',
      description: '来週のミーティング資料を準備する',
      status: 'pending',
      priority: 'low',
      dueDate: new Date('2024-02-12'),
      noteId: note2.id,
      assigneeId: user2.id,
      authorId: user2.id,
    },
  });

  console.log('Created test tasks');

  // Create activity logs
  await prisma.activityLog.create({
    data: {
      userId: user1.id,
      action: 'CREATE',
      resourceType: 'NOTE',
      resourceId: note1.id,
      details: {
        title: note1.title,
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user2.id,
      action: 'CREATE',
      resourceType: 'NOTE',
      resourceId: note2.id,
      details: {
        title: note2.title,
      },
    },
  });

  console.log('Created activity logs');

  console.log('✅ Seed data created successfully!');
  console.log('\nTest users:');
  console.log('- john@example.com / password123');
  console.log('- jane@example.com / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });