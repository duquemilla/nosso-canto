import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  Heart,
  Plus,
  Trash2,
  ListMusic,
  Check,
  Disc3,
  PartyPopper,
  ExternalLink,
  X,
  Edit3,
} from 'lucide-react';
import {
  AppData,
  Partner,
  CoupleDreamItem,
  CoupleSongItem,
  CouplePlaylistLink,
} from '../types';

interface SintoniaViewProps {
  data: AppData;
  activePartner: Partner;
  onUpdateData: (updater: AppData | ((prev: AppData) => AppData)) => void;
}

export const SintoniaView: React.FC<SintoniaViewProps> = ({
  data,
  activePartner,
  onUpdateData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dreams' | 'soundtrack'>('dreams');

  // Dreams State - purely from user data (no undeletable mock items)
  const dreams = data.coupleDreams || [];

  const [dreamFilter, setDreamFilter] = useState<'all' | 'planejando' | 'realizado'>('all');
  const [isAddDreamOpen, setIsAddDreamOpen] = useState(false);
  const [editingDream, setEditingDream] = useState<CoupleDreamItem | null>(null);

  const [dreamTitle, setDreamTitle] = useState('');
  const [dreamDesc, setDreamDesc] = useState('');
  const [dreamCategory, setDreamCategory] = useState<CoupleDreamItem['category']>('experiencia');

  // Soundtrack State - purely from user data (no undeletable mock items)
  const soundtrack = data.coupleSoundtrack || {
    anthemSongId: undefined,
    songs: [],
    playlists: [],
  };

  const songs = soundtrack.songs || [];
  const playlists = soundtrack.playlists || [];

  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<CoupleSongItem | null>(null);

  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songDedication, setSongDedication] = useState('');
  const [songCategory, setSongCategory] = useState<CoupleSongItem['category']>('romantica');
  const [songLink, setSongLink] = useState('');

  const [isAddPlaylistOpen, setIsAddPlaylistOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<CouplePlaylistLink | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistPlatform, setPlaylistPlatform] = useState<CouplePlaylistLink['platform']>('spotify');

  const partner1Name = data.profile.partner1.nickname || data.profile.partner1.name || 'Milla';
  const partner2Name = data.profile.partner2.nickname || data.profile.partner2.name || 'Cassi';

  // Open Dream Modal (Create)
  const handleOpenAddDream = () => {
    setEditingDream(null);
    setDreamTitle('');
    setDreamDesc('');
    setDreamCategory('experiencia');
    setIsAddDreamOpen(true);
  };

  // Open Dream Modal (Edit)
  const handleOpenEditDream = (dream: CoupleDreamItem) => {
    setEditingDream(dream);
    setDreamTitle(dream.title);
    setDreamDesc(dream.description || '');
    setDreamCategory(dream.category);
    setIsAddDreamOpen(true);
  };

  // Save Dream (Create or Edit)
  const handleSaveDream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dreamTitle.trim()) return;

    if (editingDream) {
      // Edit existing dream
      const updatedDreams = dreams.map((d) =>
        d.id === editingDream.id
          ? {
              ...d,
              title: dreamTitle.trim(),
              description: dreamDesc.trim() || undefined,
              category: dreamCategory,
            }
          : d
      );
      onUpdateData((prev) => ({
        ...prev,
        coupleDreams: updatedDreams,
      }));
    } else {
      // Create new dream
      const newDream: CoupleDreamItem = {
        id: 'dream-' + Date.now(),
        title: dreamTitle.trim(),
        description: dreamDesc.trim() || undefined,
        category: dreamCategory,
        status: 'planejando',
        suggestedBy: activePartner.id,
      };
      onUpdateData((prev) => ({
        ...prev,
        coupleDreams: [newDream, ...dreams],
      }));
    }

    setDreamTitle('');
    setDreamDesc('');
    setEditingDream(null);
    setIsAddDreamOpen(false);
  };

  const handleToggleDreamStatus = (dreamId: string) => {
    const updatedDreams = dreams.map((dream) => {
      if (dream.id === dreamId) {
        const isNowAchieved = dream.status !== 'realizado';
        return {
          ...dream,
          status: isNowAchieved ? ('realizado' as const) : ('planejando' as const),
          achievedAt: isNowAchieved ? new Date().toISOString() : undefined,
        };
      }
      return dream;
    });

    onUpdateData((prev) => ({
      ...prev,
      coupleDreams: updatedDreams,
    }));
  };

  const handleDeleteDream = (dreamId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      coupleDreams: dreams.filter((d) => d.id !== dreamId),
    }));
  };

  // Open Song Modal (Create)
  const handleOpenAddSong = () => {
    setEditingSong(null);
    setSongTitle('');
    setSongArtist('');
    setSongDedication('');
    setSongCategory('romantica');
    setSongLink('');
    setIsAddSongOpen(true);
  };

  // Open Song Modal (Edit)
  const handleOpenEditSong = (song: CoupleSongItem) => {
    setEditingSong(song);
    setSongTitle(song.title);
    setSongArtist(song.artist);
    setSongDedication(song.dedication || '');
    setSongCategory(song.category || 'romantica');
    setSongLink(song.link || '');
    setIsAddSongOpen(true);
  };

  // Save Song (Create or Edit)
  const handleSaveSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !songArtist.trim()) return;

    if (editingSong) {
      // Edit existing song
      const updatedSongs = songs.map((s) =>
        s.id === editingSong.id
          ? {
              ...s,
              title: songTitle.trim(),
              artist: songArtist.trim(),
              dedication: songDedication.trim() || undefined,
              category: songCategory,
              link: songLink.trim() || undefined,
            }
          : s
      );
      onUpdateData((prev) => ({
        ...prev,
        coupleSoundtrack: {
          ...soundtrack,
          songs: updatedSongs,
        },
      }));
    } else {
      // Create new song
      const newSong: CoupleSongItem = {
        id: 'song-' + Date.now(),
        title: songTitle.trim(),
        artist: songArtist.trim(),
        dedication: songDedication.trim() || undefined,
        addedBy: activePartner.id,
        category: songCategory,
        link: songLink.trim() || undefined,
      };

      // If it's the very first song, set as anthem automatically
      const newAnthemId = soundtrack.anthemSongId || newSong.id;

      onUpdateData((prev) => ({
        ...prev,
        coupleSoundtrack: {
          ...soundtrack,
          anthemSongId: newAnthemId,
          songs: [newSong, ...songs],
        },
      }));
    }

    setSongTitle('');
    setSongArtist('');
    setSongDedication('');
    setSongLink('');
    setEditingSong(null);
    setIsAddSongOpen(false);
  };

  const handleDeleteSong = (songId: string) => {
    const updatedSongs = songs.filter((s) => s.id !== songId);
    const newAnthem = soundtrack.anthemSongId === songId ? updatedSongs[0]?.id : soundtrack.anthemSongId;
    onUpdateData((prev) => ({
      ...prev,
      coupleSoundtrack: {
        ...soundtrack,
        anthemSongId: newAnthem,
        songs: updatedSongs,
      },
    }));
  };

  const handleSetAnthem = (songId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      coupleSoundtrack: {
        ...soundtrack,
        anthemSongId: soundtrack.anthemSongId === songId ? undefined : songId,
      },
    }));
  };

  // Open Playlist Modal (Create)
  const handleOpenAddPlaylist = () => {
    setEditingPlaylist(null);
    setPlaylistName('');
    setPlaylistUrl('');
    setPlaylistPlatform('spotify');
    setIsAddPlaylistOpen(true);
  };

  // Open Playlist Modal (Edit)
  const handleOpenEditPlaylist = (pl: CouplePlaylistLink) => {
    setEditingPlaylist(pl);
    setPlaylistName(pl.name);
    setPlaylistUrl(pl.url);
    setPlaylistPlatform(pl.platform);
    setIsAddPlaylistOpen(true);
  };

  // Save Playlist (Create or Edit)
  const handleSavePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim() || !playlistUrl.trim()) return;

    if (editingPlaylist) {
      const updatedPlaylists = playlists.map((p) =>
        p.id === editingPlaylist.id
          ? {
              ...p,
              name: playlistName.trim(),
              platform: playlistPlatform,
              url: playlistUrl.trim(),
            }
          : p
      );
      onUpdateData((prev) => ({
        ...prev,
        coupleSoundtrack: {
          ...soundtrack,
          playlists: updatedPlaylists,
        },
      }));
    } else {
      const newPlaylist: CouplePlaylistLink = {
        id: 'pl-' + Date.now(),
        name: playlistName.trim(),
        platform: playlistPlatform,
        url: playlistUrl.trim(),
      };
      onUpdateData((prev) => ({
        ...prev,
        coupleSoundtrack: {
          ...soundtrack,
          playlists: [newPlaylist, ...playlists],
        },
      }));
    }

    setPlaylistName('');
    setPlaylistUrl('');
    setEditingPlaylist(null);
    setIsAddPlaylistOpen(false);
  };

  const handleDeletePlaylist = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      coupleSoundtrack: {
        ...soundtrack,
        playlists: playlists.filter((p) => p.id !== id),
      },
    }));
  };

  const filteredDreams = dreams.filter((d) => {
    if (dreamFilter === 'planejando') return d.status === 'planejando';
    if (dreamFilter === 'realizado') return d.status === 'realizado';
    return true;
  });

  const achievedCount = dreams.filter((d) => d.status === 'realizado').length;
  const anthemSong = songs.find((s) => s.id === soundtrack.anthemSongId) || songs[0];

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF3EC] via-white to-[#FDF0F3] dark:from-[#2A1E24] dark:via-[#241920] dark:to-[#332029] p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/70 dark:bg-rose-950/60 text-[#E07A8B] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sintonia do Casal 💕</span>
            </div>
            <h1 className="text-2xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
              Sonhos & Trilha Sonora
            </h1>
            <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mt-1 max-w-xl">
              O cantinho especial de {partner1Name} & {partner2Name}: planos que sonhamos realizar juntas e a playlist da nossa história.
            </p>
          </div>

          {/* SubTab Toggle - Balanced, compact & perfectly sized */}
          <div className="flex items-center shrink-0 p-1 rounded-2xl bg-white dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs self-start sm:self-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('dreams')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'dreams'
                  ? 'bg-[#E07A8B] text-white shadow-xs'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Sonhos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium opacity-90 bg-black/10 dark:bg-white/15">
                {achievedCount}/{dreams.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('soundtrack')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'soundtrack'
                  ? 'bg-[#E07A8B] text-white shadow-xs'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
              }`}
            >
              <Music className="w-3.5 h-3.5 shrink-0" />
              <span>Trilha</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium opacity-90 bg-black/10 dark:bg-white/15">
                {songs.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: DREAMS / BUCKET LIST */}
      {activeSubTab === 'dreams' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#251B21] p-3.5 sm:p-4 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs">
            {/* Filter Pills with equal height and no line wrapping */}
            <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] dark:bg-[#1E161A] rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDreamFilter('all')}
                className={`flex-1 sm:flex-none h-9 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer ${
                  dreamFilter === 'all'
                    ? 'bg-[#E07A8B] text-white shadow-xs'
                    : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
                }`}
              >
                <span>Todos</span>
                <span className="text-[11px] opacity-80">({dreams.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDreamFilter('planejando')}
                className={`flex-1 sm:flex-none h-9 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer ${
                  dreamFilter === 'planejando'
                    ? 'bg-[#E07A8B] text-white shadow-xs'
                    : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
                }`}
              >
                <span>A Realizar</span>
                <span className="text-[11px] opacity-80">({dreams.length - achievedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setDreamFilter('realizado')}
                className={`flex-1 sm:flex-none h-9 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer ${
                  dreamFilter === 'realizado'
                    ? 'bg-[#E07A8B] text-white shadow-xs'
                    : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
                }`}
              >
                <span>Conquistados</span>
                <span className="text-[11px] opacity-80">({achievedCount})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenAddDream}
              className="w-full sm:w-auto h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7b] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              title="Adicionar novo plano ou sonho para o casal"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Novo Sonho</span>
            </button>
          </div>

          {/* Dreams List */}
          {filteredDreams.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-[#251B21] border border-dashed border-[#F2E8E4] dark:border-[#3D2F36]">
              <Sparkles className="w-12 h-12 mx-auto text-[#E07A8B]/60 mb-3" />
              <h3 className="text-base font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                Nenhum sonho cadastrado ainda
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1 max-w-sm mx-auto">
                Clique no botão "Adicionar Novo Sonho" acima para registrar os planos e vontades do casal!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDreams.map((dream) => {
                const isDone = dream.status === 'realizado';
                const isP1 = dream.suggestedBy === 'partner1';
                const authorName = isP1 ? partner1Name : partner2Name;

                return (
                  <div
                    key={dream.id}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40'
                        : 'bg-white dark:bg-[#251B21] border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleDreamStatus(dream.id)}
                        className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isDone
                            ? 'bg-[#E07A8B] text-white shadow-xs'
                            : 'border-2 border-[#D8CCD2] dark:border-[#52414A] hover:border-[#E07A8B]'
                        }`}
                        title={isDone ? 'Marcar como não realizado' : 'Marcar como conquistado!'}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              isDone
                                ? 'line-through text-[#7D6F74] dark:text-[#8E7F86]'
                                : 'text-[#2D2327] dark:text-[#FAF4F0]'
                            }`}
                          >
                            {dream.title}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditDream(dream)}
                              className="text-[#B8A8AF] hover:text-[#E07A8B] transition-colors p-1"
                              title="Editar sonho"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDream(dream.id)}
                              className="text-[#B8A8AF] hover:text-red-500 transition-colors p-1"
                              title="Apagar sonho"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {dream.description && (
                          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1 leading-relaxed">
                            {dream.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                          <span className="px-2 py-0.5 rounded-full bg-[#FAF3EC] dark:bg-[#2D2228] text-[#7D6F74] dark:text-[#B8A8AF] font-medium">
                            💡 Sugerido por {authorName}
                          </span>
                          {isDone && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold">
                              <PartyPopper className="w-3 h-3" />
                              <span>Conquistado com amor!</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SOUNDTRACK / MÚSICAS */}
      {activeSubTab === 'soundtrack' && (
        <div className="space-y-6">
          {/* Featured Anthem */}
          {anthemSong && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-[#E07A8B] to-[#f492a5] p-6 text-white shadow-lg">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
                    <Disc3 className="w-8 h-8 animate-spin text-white" style={{ animationDuration: '8s' }} />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/25 text-[11px] font-bold tracking-wide uppercase mb-1">
                      <Heart className="w-3 h-3 fill-current" />
                      <span>Nossa Música Oficial</span>
                    </div>
                    <h3 className="text-xl font-black">{anthemSong.title}</h3>
                    <p className="text-xs text-white/90 font-medium">{anthemSong.artist}</p>
                    {anthemSong.dedication && (
                      <p className="text-xs text-white/80 mt-1 italic font-serif">
                        "{anthemSong.dedication}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditSong(anthemSong)}
                    className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all"
                    title="Editar música oficial"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {anthemSong.link && (
                    <a
                      href={anthemSong.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#E07A8B] text-xs font-bold shadow-md hover:bg-rose-50 transition-all shrink-0"
                    >
                      <span>Ouvir Agora</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Bar for Songs and Playlists */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#251B21] p-4 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36]">
            <div>
              <h3 className="text-sm font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                Músicas que Lembram Nós Duas
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                Canções especiais com dedicatórias sinceras
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleOpenAddPlaylist}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2F2228] text-[#7D6F74] dark:text-[#B8A8AF] text-xs font-semibold hover:text-[#2D2327] border border-[#F2E8E4] dark:border-[#3D2F36] cursor-pointer"
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>+ Playlist</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddSong}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7b] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar Música</span>
              </button>
            </div>
          </div>

          {/* Playlists Links (if any) */}
          {playlists.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#7D6F74] dark:text-[#B8A8AF] uppercase tracking-wider">
                Nossas Playlists Compartilhadas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#251B21] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-[#2D2327] dark:text-[#FAF4F0] truncate">
                          {pl.name}
                        </p>
                        <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] capitalize">
                          {pl.platform}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={pl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-[#FAF3EC] dark:bg-[#2F2228] text-[#E07A8B] font-semibold text-[11px] hover:underline flex items-center gap-1"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleOpenEditPlaylist(pl)}
                        className="text-[#B8A8AF] hover:text-[#E07A8B] p-1.5"
                        title="Editar playlist"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlaylist(pl.id)}
                        className="text-[#B8A8AF] hover:text-red-500 p-1.5"
                        title="Apagar playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Songs Grid */}
          {songs.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-[#251B21] border border-dashed border-[#F2E8E4] dark:border-[#3D2F36]">
              <Music className="w-12 h-12 mx-auto text-[#E07A8B]/60 mb-3" />
              <h3 className="text-base font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                Nenhuma música adicionada ainda
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1 max-w-sm mx-auto">
                Clique no botão "+ Adicionar Música" acima para cadastrar a trilha sonora de vocês duas!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {songs.map((song) => {
                const isAnthem = song.id === soundtrack.anthemSongId;
                const isP1 = song.addedBy === 'partner1';
                const adderName = isP1 ? partner1Name : partner2Name;

                return (
                  <div
                    key={song.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#251B21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#E07A8B] flex items-center justify-center shrink-0">
                            <Music className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <h4 className="text-sm font-bold text-[#2D2327] dark:text-[#FAF4F0] truncate">
                              {song.title}
                            </h4>
                            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] truncate">
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSetAnthem(song.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isAnthem
                                ? 'text-[#E07A8B] bg-rose-50 dark:bg-rose-950/60'
                                : 'text-[#B8A8AF] hover:text-[#E07A8B]'
                            }`}
                            title={isAnthem ? 'Música oficial atual' : 'Definir como música oficial'}
                          >
                            <Heart className={`w-4 h-4 ${isAnthem ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditSong(song)}
                            className="text-[#B8A8AF] hover:text-[#E07A8B] p-1.5"
                            title="Editar música"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSong(song.id)}
                            className="text-[#B8A8AF] hover:text-red-500 p-1.5"
                            title="Apagar música"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {song.dedication && (
                        <div className="mt-3 p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] text-xs text-[#2D2327] dark:text-[#FAF4F0] italic border border-[#F2E8E4] dark:border-[#3D2F36]">
                          "{song.dedication}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36] text-[11px]">
                      <span className="text-[#7D6F74] dark:text-[#B8A8AF]">
                        Colocada por <strong className="text-[#2D2327] dark:text-[#FAF4F0]">{adderName}</strong>
                      </span>

                      {song.link && (
                        <a
                          href={song.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#E07A8B] font-semibold hover:underline"
                        >
                          <span>Ouvir</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT DREAM */}
      {isAddDreamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overscroll-contain">
          <div className="w-full max-w-md bg-white dark:bg-[#251B21] rounded-3xl p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="text-base font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                  {editingDream ? 'Editar Sonho do Casal' : 'Novo Sonho do Casal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDreamOpen(false)}
                className="text-[#7D6F74] hover:text-[#2D2327] dark:text-[#B8A8AF] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDream} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                  Qual é o sonho ou plano? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Piquenique ao pôr do sol na praia..."
                  value={dreamTitle}
                  onChange={(e) => setDreamTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-hidden focus:border-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                  Detalhes / Como imaginamos:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Levar morangos, queijo brie e uma toalha xadrez..."
                  value={dreamDesc}
                  onChange={(e) => setDreamDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-hidden focus:border-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                  Categoria:
                </label>
                <select
                  value={dreamCategory}
                  onChange={(e) => setDreamCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                >
                  <option value="experiencia">✨ Experiência a dois</option>
                  <option value="viagem">✈️ Viagem ou Passeio</option>
                  <option value="aventura">🌿 Aventura / Natureza</option>
                  <option value="conquista">🏆 Conquista / Meta da Casa</option>
                  <option value="outro">💖 Outro Desejo</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDreamOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2F2228] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7b] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editingDream ? 'Atualizar Sonho 💕' : 'Salvar Sonho 💕'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SONG */}
      {isAddSongOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overscroll-contain">
          <div className="w-full max-w-md bg-white dark:bg-[#251B21] rounded-3xl p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="text-base font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                  {editingSong ? 'Editar Canção' : 'Adicionar à Trilha Sonora'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSongOpen(false)}
                className="text-[#7D6F74] hover:text-[#2D2327] dark:text-[#B8A8AF] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSong} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                  Nome da Música *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Partilhar"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                  Artista / Banda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rubel"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                  Dedicatória ou Lembrança Especial:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Lembra daquele dia em que cantamos essa no carro?"
                  value={songDedication}
                  onChange={(e) => setSongDedication(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                  Link do Spotify ou YouTube (Opcional):
                </label>
                <input
                  type="url"
                  placeholder="https://open.spotify.com/track/..."
                  value={songLink}
                  onChange={(e) => setSongLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSongOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2F2228] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7b] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editingSong ? 'Atualizar Canção 🎵' : 'Adicionar Canção 🎵'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PLAYLIST */}
      {isAddPlaylistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overscroll-contain">
          <div className="w-full max-w-md bg-white dark:bg-[#251B21] rounded-3xl p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="text-base font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                  {editingPlaylist ? 'Editar Playlist' : 'Playlist do Casal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPlaylistOpen(false)}
                className="text-[#7D6F74] hover:text-[#2D2327] dark:text-[#B8A8AF] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlaylist} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                  Nome da Playlist *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cozinhando Juntas 🍳"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                  Plataforma:
                </label>
                <select
                  value={playlistPlatform}
                  onChange={(e) => setPlaylistPlatform(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                >
                  <option value="spotify">Spotify</option>
                  <option value="apple">Apple Music</option>
                  <option value="youtube">YouTube Music</option>
                  <option value="outra">Outra</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                  Link da Playlist *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://open.spotify.com/playlist/..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPlaylistOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2F2228] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7b] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editingPlaylist ? 'Atualizar Playlist 🎵' : 'Salvar Playlist 🎵'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
