import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';



import type { AssignmentDrillContextPayload } from '@/types/learning';



import {

  resolveVocabularyDrillPresentationFromSessionConfig,

  type VocabularyDrillLobbyProfileId,

  type VocabularyDrillPresentationProfile,

} from './vocabulary-drill-presentation.mapper';



export type VocabularyDrillLobbyStat = {

  label: string;

  value: string;

};



export type VocabularyDrillLobbyViewModel = {

  profileId: VocabularyDrillLobbyProfileId;

  presentation: VocabularyDrillPresentationProfile;

  eyebrow: string;

  title: string;

  description: string;

  stats: VocabularyDrillLobbyStat[];

  footerHint?: string;

  showModePicker: boolean;

  ctaLabel: string;

};



function fillLobbyTemplate(

  template: string,

  vars: Record<string, string | number>,

): string {

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>

    vars[key] != null ? String(vars[key]) : '',

  );

}



export function buildVocabularyDrillLobbyViewModel(input: {

  sessionConfig: GameSessionConfig | null;

  assignmentCtx: AssignmentDrillContextPayload | null;

}): VocabularyDrillLobbyViewModel | null {

  const { sessionConfig, assignmentCtx } = input;

  if (!sessionConfig) {

    return null;

  }



  const presentation = resolveVocabularyDrillPresentationFromSessionConfig(sessionConfig);

  const lobby = sessionConfig.presentation.lobby;



  if (!assignmentCtx) {

    const free = lobby?.freePractice;

    return {

      profileId: 'free_practice',

      presentation,

      eyebrow: free?.eyebrow ?? 'Luyện từ vựng',

      title: free?.title ?? 'Survival Challenge',

      description:

        free?.description ??

        'Trả lời đúng liên tiếp để ghi điểm. Một câu sai — lượt kết thúc.',

      stats: [],

      showModePicker: true,

      ctaLabel: free?.ctaLabel ?? 'Bắt đầu lượt chơi',

    };

  }



  const bestTotal = assignmentCtx.bestTotal ?? assignmentCtx.assignmentPoolSize;

  const isPool = presentation.usesPoolProgressBar;

  const profileId: VocabularyDrillLobbyProfileId = isPool

    ? 'assignment_pool_coverage'

    : 'assignment_survival';



  const assignmentCopy = lobby?.assignment;

  const templateVars = {

    minimumScore: assignmentCtx.minimumScore,

    bestScore: assignmentCtx.bestScore,

    bestTotal,

    poolSize: assignmentCtx.assignmentPoolSize,

  };



  const description = assignmentCtx.assignmentComplete

    ? fillLobbyTemplate(

        assignmentCopy?.descriptionComplete ??

          (isPool

            ? 'Bạn đã hoàn thành bài kiểm tra. Kết quả cao nhất: {{bestScore}}/{{bestTotal}}.'

            : 'Bạn đã đạt yêu cầu. Điểm cao nhất: {{bestScore}}/{{minimumScore}}.'),

        templateVars,

      )

    : fillLobbyTemplate(

        assignmentCopy?.descriptionActive ??

          (isPool

            ? 'Chơi hết {{poolSize}} từ đã chọn — điểm = số câu đúng / tổng số từ. Cần đạt {{minimumScore}} từ đúng.'

            : 'Đạt {{minimumScore}} điểm trong một lượt để nộp bài. Chưa đủ ngưỡng — chỉ lưu lịch sử lượt chơi.'),

        templateVars,

      );



  return {

    profileId,

    presentation,

    eyebrow: assignmentCopy?.eyebrow ?? 'Bài tập luyện từ',

    title: assignmentCtx.title,

    description,

    stats: [

      {

        label:

          assignmentCopy?.statMinimumLabel ??

          (isPool ? 'Từ đúng tối thiểu' : 'Mục tiêu'),

        value: String(assignmentCtx.minimumScore),

      },

      {

        label: assignmentCopy?.statBestLabel ?? 'Cao nhất',

        value:

          isPool && bestTotal

            ? `${assignmentCtx.bestScore}/${bestTotal}`

            : String(assignmentCtx.bestScore),

      },

      {

        label: assignmentCopy?.statPoolLabel ?? 'Từ bài',

        value: String(assignmentCtx.assignmentPoolSize),

      },

    ],

    footerHint: isPool

      ? assignmentCopy?.footerHint ??

        'Chế độ kiểm tra thuộc từ — bạn cần trả lời hết danh sách từ, không đổi mode.'

      : undefined,

    showModePicker: false,

    ctaLabel: assignmentCopy?.ctaLabel ?? 'Bắt đầu chơi',

  };

}

