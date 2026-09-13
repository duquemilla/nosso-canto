import React, { useState } from 'react';
import { Brain, CheckCircle2, XCircle, RotateCcw, Lightbulb, ArrowRight, Trophy } from 'lucide-react';

interface BrainTeaser {
  id: number;
  title: string;
  category: 'Enigma Clássico' | 'Lógica & Matemática' | 'Pensamento Lateral' | 'Sequência & Padrões';
  difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Gênio';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

const BRAIN_TEASERS: BrainTeaser[] = [
  {
    id: 1,
    title: 'A Travessia do Rio',
    category: 'Enigma Clássico',
    difficulty: 'Médio',
    question:
      'Um viajante precisa atravessar um rio com um lobo, uma cabra e um maço de couve. O barco só comporta ele e mais um deles. Se o lobo ficar sozinho com a cabra, ele a come. Se a cabra ficar com a couve, ela a come. Quem ele deve levar primeiro para o outro lado?',
    options: ['O Lobo', 'A Cabra', 'A Couve', 'Pode levar qualquer um'],
    correctIndex: 1,
    explanation:
      'Ele deve levar a cabra primeiro! O lobo não come a couve, logo eles podem ficar juntos na margem inicial em segurança. Depois ele volta e continua o processo.',
    hint: 'Pense em qual dupla consegue ficar junta na margem sem que um coma o outro.',
  },
  {
    id: 2,
    title: 'A Corrida de Revezamento',
    category: 'Pensamento Lateral',
    difficulty: 'Fácil',
    question:
      'Você está correndo uma maratona e, com muito esforço, consegue ultrapassar a pessoa que estava em 2º lugar. Em que posição você está agora?',
    options: ['1º lugar', '2º lugar', '3º lugar', 'Desclassificado'],
    correctIndex: 1,
    explanation:
      'Se você ultrapassou o 2º colocado, você tomou a posição dele, logo agora você é o 2º lugar! (Para ser o 1º, você teria que ultrapassar o líder).',
    hint: 'Imagine a fila da corrida: ao passar quem estava na sua frente imediata, você assume a vaga dele.',
  },
  {
    id: 3,
    title: 'O Lago de Vitórias-Régias',
    category: 'Lógica & Matemática',
    difficulty: 'Médio',
    question:
      'Em um lago, há um lote de vitórias-régias que dobra de tamanho todos os dias. Se leva exatamente 48 dias para o lote cobrir todo o lago, em quantos dias o lote cobriu a METADE do lago?',
    options: ['24 dias', '47 dias', '36 dias', '12 dias'],
    correctIndex: 1,
    explanation:
      'Leva 47 dias! Se a quantidade dobra todos os dias, um dia antes de cobrir 100% (dia 48), ela cobria exatamente 50% (metade) do lago.',
    hint: 'Pense de trás para frente a partir do dia 48.',
  },
  {
    id: 4,
    title: 'Os Três Interruptores',
    category: 'Pensamento Lateral',
    difficulty: 'Difícil',
    question:
      'Você está do lado de fora de uma sala fechada com 3 interruptores na parede. Apenas um deles acende a única lâmpada incandescente que está lá dentro. Você só pode abrir a porta e entrar na sala UMA ÚNICA VEZ. Como saber com certeza qual interruptor acende a lâmpada?',
    options: [
      'Ligar o 1, entrar e olhar',
      'Ligar o 1 por 10 min, desligar, ligar o 2 e entrar (a lâmpada acesa é o 2, a quente apagada é o 1, a fria é o 3)',
      'Ligar todos os 3 ao mesmo tempo',
      'Olhar pela fresta da fechadura',
    ],
    correctIndex: 1,
    explanation:
      'Lâmpadas incandescentes geram calor! Ao deixar o 1º ligado por alguns minutos e desligar, ao entrar você testa: se estiver acesa é o 2; se estiver apagada mas quente ao toque é o 1; se estiver apagada e fria é o 3.',
    hint: 'Além da luz visível, que outra propriedade física uma lâmpada acesa por muito tempo adquire?',
  },
  {
    id: 5,
    title: 'Sequência Numérica Curiosa',
    category: 'Sequência & Padrões',
    difficulty: 'Médio',
    question: 'Qual é o próximo número da sequência lógica: 2, 3, 5, 7, 11, 13, 17, 19, ?',
    options: ['21', '23', '25', '27'],
    correctIndex: 1,
    explanation:
      'Esta é a sequência clássica dos Números Primos (números divisíveis apenas por 1 e por eles mesmos). O próximo número primo após 19 é o 23 (já que 21 é divisível por 3 e 7).',
    hint: 'Verifique se os números da sequência podem ser divididos por outros números inteiros.',
  },
  {
    id: 6,
    title: 'O Enigma dos Pais e Filhos',
    category: 'Pensamento Lateral',
    difficulty: 'Fácil',
    question:
      'Dois pais e dois filhos foram pescar juntos pela manhã. Cada um pescou exatamente 1 peixe inteiro e não perderam nenhum. Ao final, havia exatamente 3 peixes no cesto. Como isso é possível?',
    options: [
      'Um peixe escapou',
      'Eles eram avô, pai e filho (3 pessoas no total)',
      'Eles contaram errado',
      'Um dos peixes engoliu o outro',
    ],
    correctIndex: 1,
    explanation:
      'Havia apenas 3 pessoas: o Avô (que é pai do Pai), o Pai (que é filho do Avô e pai do Neto) e o Neto (filho do Pai). Portanto: dois pais e dois filhos representam 3 pessoas!',
    hint: 'Pense em graus de parentesco que se sobrepõem entre 3 gerações de uma mesma família.',
  },
  {
    id: 7,
    title: 'A Balança de Dois Pratos',
    category: 'Lógica & Matemática',
    difficulty: 'Gênio',
    question:
      'Você tem 9 moedas de ouro aparentemente idênticas, mas UMA delas é falsa e pesa ligeiramente MENOS que as outras 8. Usando uma balança de pratos clássica, qual é o número MÍNIMO de pesagens necessárias para garantir que você encontre a moeda falsa?',
    options: ['1 pesagem', '2 pesagens', '3 pesagens', '4 pesagens'],
    correctIndex: 1,
    explanation:
      'Apenas 2 pesagens! Divida em 3 grupos de 3 moedas (A, B, C). Pese o grupo A contra B: se empatar, a falsa está no C; se um lado subir, a falsa está nele. Na 2ª pesagem, pegue as 3 moedas suspeitas e pese 1 contra 1. Se empatar, é a que sobrou.',
    hint: 'Divida em 3 pilhas iguais em vez de dividir apenas ao meio.',
  },
];

export const BrainTeasersGame: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<number, boolean>>({});

  const puzzle = BRAIN_TEASERS[currentIndex];
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === puzzle.correctIndex;

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    const correct = index === puzzle.correctIndex;
    if (correct && !answeredMap[puzzle.id]) {
      setScore((s) => s + 1);
    }
    setAnsweredMap((prev) => ({ ...prev, [puzzle.id]: true }));
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % BRAIN_TEASERS.length);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowHint(false);
    setScore(0);
    setAnsweredMap({});
  };

  const difficultyColors = {
    Fácil: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    Médio: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    Difícil: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    Gênio: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Top Header & Scoreboard */}
      <div className="flex items-center justify-between bg-white dark:bg-[#20181D] p-4 rounded-3xl border border-[#F2E8E4] dark:border-[#3D2F36]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
              Desafios de Lógica & Raciocínio
            </h3>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Quebra-cabeças, enigmas de travessia e pensamento lateral
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            <span>{score} acertos</span>
          </div>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Reiniciar desafios"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-[#20181D] p-5 sm:p-6 rounded-3xl border border-[#F2E8E4] dark:border-[#3D2F36] space-y-4 shadow-xs">
        {/* Meta badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#E07A8B]">
              Desafio {currentIndex + 1} de {BRAIN_TEASERS.length}
            </span>
            <span className="text-[#7D6F74]">•</span>
            <span className="text-[#7D6F74] dark:text-[#B8A8AF]">{puzzle.category}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${difficultyColors[puzzle.difficulty]}`}>
            {puzzle.difficulty}
          </span>
        </div>

        {/* Title & Question text */}
        <div>
          <h4 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0] mb-2">
            {puzzle.title}
          </h4>
          <p className="text-sm text-[#4D3F45] dark:text-[#D1C3C9] leading-relaxed">
            {puzzle.question}
          </p>
        </div>

        {/* Hint button */}
        {!isAnswered && (
          <div>
            <button
              onClick={() => setShowHint((prev) => !prev)}
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 hover:underline"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{showHint ? 'Ocultar pista' : 'Ver uma pista'}</span>
            </button>
            {showHint && (
              <div className="mt-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-800 dark:text-amber-200">
                💡 <strong>Pista:</strong> {puzzle.hint}
              </div>
            )}
          </div>
        )}

        {/* Options List */}
        <div className="space-y-2 pt-2">
          {puzzle.options.map((option, idx) => {
            let btnStyle =
              'bg-[#FAF8F5] dark:bg-[#2A2026] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] hover:border-[#E07A8B]';

            if (isAnswered) {
              if (idx === puzzle.correctIndex) {
                btnStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
              } else if (idx === selectedOption) {
                btnStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 line-through';
              } else {
                btnStyle = 'opacity-50 border-transparent text-[#7D6F74]';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${btnStyle}`}
              >
                <span>{option}</span>
                {isAnswered && idx === puzzle.correctIndex && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                {isAnswered && idx === selectedOption && idx !== puzzle.correctIndex && (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Button */}
        {isAnswered && (
          <div className="pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36] space-y-3 animate-in fade-in">
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-900 dark:text-rose-200'
              }`}
            >
              <p className="font-bold mb-1">
                {isCorrect ? '✨ Resposta Correta!' : 'Não foi dessa vez!'}
              </p>
              <p>{puzzle.explanation}</p>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 rounded-2xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Próximo Enigma</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
