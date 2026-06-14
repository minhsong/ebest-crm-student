'use client';



import { Button } from 'antd';

import { AudioOutlined, ThunderboltOutlined } from '@ant-design/icons';

import type { DrillPracticeSelection } from '@/features/learning/hooks/useDrillPracticePool';

import type { VocabularyDrillLobbyViewModel } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-lobby.mapper';



type Props = {

  vm: VocabularyDrillLobbyViewModel;

  selection: DrillPracticeSelection;

  onSelectionChange: (selection: DrillPracticeSelection) => void;

  canStart: boolean;

  onStart: () => void;

};



function isSameSelection(a: DrillPracticeSelection, b: DrillPracticeSelection): boolean {

  return a.modeId === b.modeId && a.promptType === b.promptType;

}



export function FreePracticeLobbyHero({

  vm,

  selection,

  onSelectionChange,

  canStart,

  onStart,

}: Props) {

  const meaningSelection: DrillPracticeSelection = {

    modeId: 'survival',

    promptType: 'meaning_to_word',

  };

  const audioSelection: DrillPracticeSelection = {

    modeId: 'survival',

    promptType: 'audio_to_word',

  };



  return (

    <>

      <div className="drill-lobby-hero">

        <p className="drill-lobby-hero__eyebrow">{vm.eyebrow}</p>

        <h2 className="drill-lobby-hero__title">{vm.title}</h2>

        <p className="drill-lobby-hero__desc">{vm.description}</p>

      </div>



      <div>

        <p className="drill-lobby-section-title">Chế độ chơi</p>

        <div className="drill-lobby-modes">

          <button

            type="button"

            className={`drill-lobby-mode${isSameSelection(selection, meaningSelection) ? ' is-active' : ''}`}

            onClick={() => onSelectionChange(meaningSelection)}

          >

            <span className="drill-lobby-mode__icon">

              <ThunderboltOutlined />

            </span>

            <span className="drill-lobby-mode__name">Survival</span>

            <span className="drill-lobby-mode__desc">Nghĩa TV → chọn từ Anh</span>

          </button>

          <button

            type="button"

            className={`drill-lobby-mode${isSameSelection(selection, audioSelection) ? ' is-active' : ''}`}

            onClick={() => onSelectionChange(audioSelection)}

          >

            <span className="drill-lobby-mode__icon">

              <AudioOutlined />

            </span>

            <span className="drill-lobby-mode__name">Nghe phát âm</span>

            <span className="drill-lobby-mode__desc">Nghe audio → chọn từ</span>

          </button>

        </div>

      </div>



      <Button

        type="primary"

        size="large"

        icon={<ThunderboltOutlined />}

        className="drill-lobby-cta"

        disabled={!canStart}

        onClick={onStart}

      >

        {vm.ctaLabel}

      </Button>

    </>

  );

}

