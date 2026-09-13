import React, { useState, useRef } from 'react';
import {
  Film,
  Plus,
  ExternalLink,
  Star,
  CheckCircle2,
  Clock,
  Eye,
  Trash2,
  Edit3,
  Search,
  Filter,
  Sparkles,
  Share2,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import { MovieItem, PartnerId, CoupleProfile } from '../types';
import { compressImageFile } from '../utils/imageCompression';
import { PartnerAvatar } from './PartnerAvatar';

const GENRE_SUGGESTIONS = [
  'Comédia Romântica',
  'Romance / Drama',
  'Suspense & Mistério',
  'Terror / Susto',
  'Ficção Científica',
  'Animação / Ghibli',
  'Dorama / K-Drama',
  'Ação & Aventura',
  'Comédia Leve',
  'Documentário',
  'Fantasia',
  'Baseado em Fatos',
];

interface MoviesViewProps {
  movies: MovieItem[];
  profile: CoupleProfile;
  activePartner: PartnerId;
  onAddMovie: (movie: Omit<MovieItem, 'id' | 'addedAt'>) => void;
  onUpdateMovie: (movie: MovieItem) => void;
  onDeleteMovie: (id: string) => void;
}

export const MoviesView: React.FC<MoviesViewProps> = ({
  movies,
  profile,
  activePartner,
  onAddMovie,
  onUpdateMovie,
  onDeleteMovie,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'to_watch' | 'watching' | 'watched'>('all');
  const [filterOrigin, setFilterOrigin] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<MovieItem | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<MovieItem | null>(null);

  // New movie form state
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newOrigin, setNewOrigin] = useState<MovieItem['origin']>('tiktok');
  const [newPlatform, setNewPlatform] = useState('Netflix');
  const [newGenre, setNewGenre] = useState('Romance / Comédia');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPosterUrl, setNewPosterUrl] = useState('');
  const addPosterFileRef = useRef<HTMLInputElement>(null);

  // All genres state (Defaults can be renamed, new ones added, etc.)
  const [allGenres, setAllGenres] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nos_dois_all_movie_genres');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      'Romance / Comédia',
      'Comédia Romântica',
      'Romance / Drama',
      'Suspense & Mistério',
      'Terror / Susto',
      'Ficção Científica',
      'Animação / Ghibli',
      'Dorama / K-Drama',
      'Ação & Aventura',
      'Comédia Leve',
      'Documentário',
      'Fantasia',
      'Baseado em Fatos',
    ];
  });

  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [isCreatingNewGenre, setIsCreatingNewGenre] = useState(false);
  const [customGenreInput, setCustomGenreInput] = useState('');

  // Edit movie form state
  const [editTitle, setEditTitle] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editOrigin, setEditOrigin] = useState<MovieItem['origin']>('tiktok');
  const [editPlatform, setEditPlatform] = useState('Netflix');
  const [editGenre, setEditGenre] = useState('Romance / Comédia');
  const [isCreatingEditGenre, setIsCreatingEditGenre] = useState(false);
  const [customEditGenreInput, setCustomEditGenreInput] = useState('');

  const handleAddCustomGenre = (genreName: string) => {
    const trimmed = genreName.trim();
    if (!trimmed) return;
    if (!allGenres.includes(trimmed)) {
      const updated = [...allGenres, trimmed];
      setAllGenres(updated);
      try {
        localStorage.setItem('nos_dois_all_movie_genres', JSON.stringify(updated));
      } catch {}
    }
  };

  const [isManagingGenresModalOpen, setIsManagingGenresModalOpen] = useState(false);
  const [editingGenreOriginal, setEditingGenreOriginal] = useState<string | null>(null);
  const [editingGenreInput, setEditingGenreInput] = useState('');

  const handleDeleteGenre = (genreToDelete: string) => {
    const updated = allGenres.filter((g) => g !== genreToDelete);
    setAllGenres(updated);
    try {
      localStorage.setItem('nos_dois_all_movie_genres', JSON.stringify(updated));
    } catch {}
    if (newGenre === genreToDelete) setNewGenre(updated[0] || 'Geral');
    if (editGenre === genreToDelete) setEditGenre(updated[0] || 'Geral');
    if (filterGenre === genreToDelete) setFilterGenre('all');
  };

  const handleSaveEditedGenre = (oldGenre: string) => {
    const trimmed = editingGenreInput.trim();
    if (!trimmed || trimmed === oldGenre) {
      setEditingGenreOriginal(null);
      return;
    }
    const updated = allGenres.map((g) => (g === oldGenre ? trimmed : g));
    setAllGenres(updated);
    try {
      localStorage.setItem('nos_dois_all_movie_genres', JSON.stringify(updated));
    } catch {}

    if (newGenre === oldGenre) setNewGenre(trimmed);
    if (editGenre === oldGenre) setEditGenre(trimmed);
    if (filterGenre === oldGenre) setFilterGenre(trimmed);

    // Update all existing movies that had this genre
    movies.forEach((m) => {
      if (m.genre === oldGenre) {
        onUpdateMovie({
          ...m,
          genre: trimmed,
        });
      }
    });

    setEditingGenreOriginal(null);
  };
  const [editStatus, setEditStatus] = useState<MovieItem['status']>('to_watch');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPosterUrl, setEditPosterUrl] = useState('');
  const editPosterFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, callback: (val: string) => void) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 0.75);
      callback(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result;
        if (typeof res === 'string') {
          callback(res);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = (movie: MovieItem) => {
    setEditingMovie(movie);
    setEditTitle(movie.title);
    setEditYear(movie.year ? String(movie.year) : '');
    setEditOrigin(movie.origin);
    setEditPlatform(movie.platform);
    setEditGenre(movie.genre);
    setEditStatus(movie.status);
    setEditLinkUrl(movie.linkUrl || '');
    setEditNotes(movie.ourNotes || '');
    setEditPosterUrl(movie.posterUrl);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie || !editTitle.trim()) return;

    onUpdateMovie({
      ...editingMovie,
      title: editTitle.trim(),
      year: editYear ? parseInt(editYear, 10) : undefined,
      origin: editOrigin,
      platform: editPlatform,
      genre: editGenre,
      status: editStatus,
      linkUrl: editLinkUrl.trim() || undefined,
      ourNotes: editNotes.trim() || undefined,
      posterUrl:
        editPosterUrl.trim() ||
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    });

    setEditingMovie(null);
  };

  const currentPartner = activePartner === 'partner1' ? profile.partner1 : profile.partner2;

  const filteredMovies = movies.filter((m) => {
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchesOrigin = filterOrigin === 'all' || m.origin === filterOrigin;
    const matchesGenre = filterGenre === 'all' || m.genre === filterGenre;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesOrigin && matchesGenre && matchesSearch;
  });

  const handleCreateMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddMovie({
      title: newTitle.trim(),
      year: newYear ? parseInt(newYear, 10) : undefined,
      origin: newOrigin,
      platform: newPlatform,
      genre: newGenre,
      status: 'to_watch',
      linkUrl: newLinkUrl.trim() || undefined,
      ourNotes: newNotes.trim() || undefined,
      posterUrl:
        newPosterUrl.trim() ||
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
      addedBy: activePartner,
    });

    // Reset form
    setNewTitle('');
    setNewYear('');
    setNewLinkUrl('');
    setNewNotes('');
    setNewPosterUrl('');
    setIsAddModalOpen(false);
  };

  const getOriginLabel = (origin: MovieItem['origin']) => {
    switch (origin) {
      case 'tiktok':
        return { label: 'TikTok', color: 'bg-black text-white dark:bg-zinc-800' };
      case 'instagram':
        return { label: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' };
      case 'amigos':
        return { label: 'Amigos', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' };
      case 'cinema':
        return { label: 'Cinema', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200' };
      default:
        return { label: 'Outro', color: 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search & Add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            Nossos Filmes & Séries Salvos
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
            Chega de perder as indicações do TikTok e Instagram no WhatsApp! Tudo organizado aqui.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#E58C9B] hover:opacity-95 text-white font-medium text-xs sm:text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Salvar Indicação</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, gênero ou plataforma..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border-none text-xs sm:text-sm text-[#2D2327] dark:text-[#FAF4F0] placeholder-[#A6999F] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
          />
        </div>

        {/* Status Filters */}
        <div className="grid grid-cols-4 gap-1 w-full md:w-auto md:flex items-center">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'to_watch', label: 'Quero Ver' },
            { id: 'watching', label: 'Assistindo' },
            { id: 'watched', label: 'Já Vimos' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterStatus(s.id as any)}
              className={`px-2 md:px-3 py-1.5 rounded-xl text-xs font-medium text-center whitespace-nowrap transition-colors ${
                filterStatus === s.id
                  ? 'bg-[#E07A8B] text-white shadow-xs'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#2D2228]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Origin & Genre Filters + Manage Button */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterOrigin}
            onChange={(e) => setFilterOrigin(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border-none text-xs text-[#7D6F74] dark:text-[#B8A8AF] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
          >
            <option value="all">Todas as origens</option>
            <option value="tiktok">Origem: TikTok</option>
            <option value="instagram">Origem: Instagram</option>
            <option value="cinema">Origem: Cinema</option>
            <option value="amigos">Origem: Indicação de Amigos</option>
          </select>

          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border-none text-xs text-[#7D6F74] dark:text-[#B8A8AF] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] max-w-[140px] truncate"
          >
            <option value="all">Todos os gêneros</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsManagingGenresModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors whitespace-nowrap cursor-pointer"
            title="Alterar nomes dos gêneros (ex: Romance, Terror) ou adicionar novos"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Editar Gêneros</span>
          </button>
        </div>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
          <Film className="w-10 h-10 mx-auto text-[#E07A8B]/60 mb-2" />
          <p className="text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
            Nenhum filme encontrado
          </p>
          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
            Que tal adicionar aquele filme que você viu no reels ou for you?
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredMovies.map((movie) => {
            const originInfo = getOriginLabel(movie.origin);
            const addedPartner =
              movie.addedBy === 'partner1' ? profile.partner1 : profile.partner2;

            return (
              <div
                key={movie.id}
                className="group relative flex flex-col rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] overflow-hidden shadow-xs hover:shadow-md transition-all"
              >
                {/* Poster & Badges */}
                <div className="relative h-44 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Origin Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${originInfo.color}`}>
                      {originInfo.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-black/80 text-zinc-900 dark:text-zinc-100 backdrop-blur-xs">
                      {movie.platform}
                    </span>
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(movie)}
                      className="p-1.5 rounded-full bg-black/50 text-white/90 hover:text-white hover:bg-black/80 transition-colors"
                      title="Editar informações do filme"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setMovieToDelete(movie)}
                      className="p-1.5 rounded-full bg-black/50 text-white/80 hover:text-rose-400 hover:bg-black/80 transition-colors"
                      title="Remover filme"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom Title on image */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-serif font-bold text-base text-white leading-snug line-clamp-1">
                      {movie.title} {movie.year ? `(${movie.year})` : ''}
                    </h3>
                    <p className="text-[11px] text-zinc-300 mt-0.5">{movie.genre}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  {/* Status Toggle Buttons */}
                  <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36]">
                    <button
                      onClick={() => onUpdateMovie({ ...movie, status: 'to_watch' })}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        movie.status === 'to_watch'
                          ? 'bg-white dark:bg-[#3D2F36] text-[#E07A8B] dark:text-[#F492A5] shadow-xs'
                          : 'text-[#7D6F74] dark:text-[#B8A8AF]'
                      }`}
                    >
                      Quero Ver
                    </button>
                    <button
                      onClick={() => onUpdateMovie({ ...movie, status: 'watching' })}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        movie.status === 'watching'
                          ? 'bg-white dark:bg-[#3D2F36] text-amber-500 shadow-xs'
                          : 'text-[#7D6F74] dark:text-[#B8A8AF]'
                      }`}
                    >
                      Assistindo
                    </button>
                    <button
                      onClick={() => onUpdateMovie({ ...movie, status: 'watched' })}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        movie.status === 'watched'
                          ? 'bg-white dark:bg-[#3D2F36] text-emerald-500 shadow-xs'
                          : 'text-[#7D6F74] dark:text-[#B8A8AF]'
                      }`}
                    >
                      Já Vimos
                    </button>
                  </div>

                  {/* Notes & Link */}
                  {movie.ourNotes && (
                    <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] italic line-clamp-2 bg-[#FAF8F5]/60 dark:bg-[#2B2127]/60 p-2 rounded-xl">
                      "{movie.ourNotes}"
                    </p>
                  )}

                  {movie.linkUrl && (
                    <a
                      href={movie.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#E07A8B] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver indicação original</span>
                    </a>
                  )}

                  {/* Couple Ratings (when watched or watching) */}
                  <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {/* Partner 1 rating */}
                      <div className="flex items-center gap-1" title={`Nota de ${profile.partner1.name}`}>
                        <PartnerAvatar avatar={profile.partner1.avatar} name={profile.partner1.name} size="xs" />
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                onUpdateMovie({
                                  ...movie,
                                  rating1: movie.rating1 === star ? undefined : star,
                                })
                              }
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-3 h-3 ${
                                  (movie.rating1 || 0) >= star
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-zinc-300 dark:text-zinc-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Partner 2 rating */}
                      <div className="flex items-center gap-1" title={`Nota de ${profile.partner2.name}`}>
                        <PartnerAvatar avatar={profile.partner2.avatar} name={profile.partner2.name} size="xs" />
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                onUpdateMovie({
                                  ...movie,
                                  rating2: movie.rating2 === star ? undefined : star,
                                })
                              }
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-3 h-3 ${
                                  (movie.rating2 || 0) >= star
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-zinc-300 dark:text-zinc-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Added By Tag */}
                    <div
                      className="inline-flex items-center gap-1 text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]"
                      title={`Salvo por ${addedPartner.name} em ${movie.addedAt}`}
                    >
                      <PartnerAvatar avatar={addedPartner.avatar} name={addedPartner.name} size="xs" />
                      <span>{addedPartner.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Movie Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-lg w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Salvar Nova Indicação
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMovie} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Título do Filme / Série *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Questão de Tempo"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Onde vimos a indicação?
                  </label>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="cinema">Cinema</option>
                    <option value="amigos">Indicação de Amigos</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Plataforma / Streaming
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="Netflix">Netflix</option>
                    <option value="Prime Video">Prime Video</option>
                    <option value="Max">Max</option>
                    <option value="Disney+">Disney+</option>
                    <option value="Apple TV+">Apple TV+</option>
                    <option value="Cinema">Cinema</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                      Gênero
                    </label>
                    {allGenres.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManagingGenresModalOpen(true)}
                        className="text-[11px] text-[#E07A8B] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Gerenciar
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={isCreatingNewGenre ? '__create_new__' : newGenre}
                      onChange={(e) => {
                        if (e.target.value === '__create_new__') {
                          setIsCreatingNewGenre(true);
                          setCustomGenreInput('');
                        } else {
                          setIsCreatingNewGenre(false);
                          setNewGenre(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 pr-8 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      <option value="">Selecione um gênero...</option>
                      {allGenres.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                      <option value="__create_new__" className="font-semibold text-[#E07A8B]">
                        ✨ + Criar outro gênero...
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Inline creation if user wants a custom genre */}
                  {isCreatingNewGenre && (
                    <div className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        value={customGenreInput}
                        onChange={(e) => setCustomGenreInput(e.target.value)}
                        placeholder="Nome do novo gênero..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customGenreInput.trim()) {
                            handleAddCustomGenre(customGenreInput.trim());
                            setNewGenre(customGenreInput.trim());
                            setIsCreatingNewGenre(false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewGenre(false)}
                        className="px-2 py-1.5 rounded-xl text-xs text-[#7D6F74] hover:bg-[#FAF3EC] dark:hover:bg-[#2D2228]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Ano (opcional)
                  </label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Link da Indicação (TikTok, Instagram ou Trailer)
                </label>
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {/* Poster Upload from mobile / URL */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2C2127] border border-[#F2E8E4] dark:border-[#3D2F36]">
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                  Foto de Capa do Filme / Série
                </label>

                {newPosterUrl ? (
                  <div className="relative h-28 w-20 rounded-xl overflow-hidden border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs group">
                    <img
                      src={newPosterUrl}
                      alt="Capa"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPosterUrl('')}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Trocar Foto
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={addPosterFileRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, setNewPosterUrl);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addPosterFileRef.current?.click()}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#33252C] border border-[#E07A8B]/40 text-[#E07A8B] hover:bg-[#FAF3EC] text-xs font-semibold transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Subir foto do celular</span>
                    </button>
                    <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">ou link:</span>
                    <input
                      type="url"
                      value={newPosterUrl}
                      onChange={(e) => setNewPosterUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#33252C] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nossas Anotações / Por que queremos ver?
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Queremos ver num domingo chuvoso com pipoca e brigadeiro..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#FAF3EC] dark:bg-[#2C2127] text-xs text-[#7D6F74] dark:text-[#B8A8AF] flex items-center gap-2">
                <PartnerAvatar avatar={currentPartner.avatar} name={currentPartner.name} size="xs" />
                <span>
                  Será salvo como adicionado por <strong>{currentPartner.name}</strong>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white font-medium shadow-xs"
                >
                  Salvar Filme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Movie Modal */}
      {editingMovie && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-lg w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Editar Filme / Indicação
                </h3>
              </div>
              <button
                onClick={() => setEditingMovie(null)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Título do Filme / Série *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Status na Lista
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="to_watch">Quero Ver</option>
                    <option value="watching">Assistindo</option>
                    <option value="watched">Já Vimos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Plataforma / Onde Assistir
                  </label>
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="Netflix">Netflix</option>
                    <option value="Prime Video">Prime Video</option>
                    <option value="Max">Max</option>
                    <option value="Disney+">Disney+</option>
                    <option value="Apple TV+">Apple TV+</option>
                    <option value="Cinema">Cinema</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Origem da Indicação
                  </label>
                  <select
                    value={editOrigin}
                    onChange={(e) => setEditOrigin(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="cinema">Cinema</option>
                    <option value="amigos">Indicação de Amigos</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Ano de Lançamento
                  </label>
                  <input
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    placeholder="Ex: 2024"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                    Gênero
                  </label>
                  {allGenres.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsManagingGenresModalOpen(true)}
                      className="text-[11px] text-[#E07A8B] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Gerenciar
                    </button>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={isCreatingEditGenre ? '__create_new__' : editGenre}
                    onChange={(e) => {
                      if (e.target.value === '__create_new__') {
                        setIsCreatingEditGenre(true);
                        setCustomEditGenreInput('');
                      } else {
                        setIsCreatingEditGenre(false);
                        setEditGenre(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 pr-8 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] appearance-none cursor-pointer text-xs sm:text-sm"
                  >
                    <option value="">Selecione um gênero...</option>
                    {allGenres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                    <option value="__create_new__" className="font-semibold text-[#E07A8B]">
                      ✨ + Criar outro gênero...
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {isCreatingEditGenre && (
                  <div className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      autoFocus
                      value={customEditGenreInput}
                      onChange={(e) => setCustomEditGenreInput(e.target.value)}
                      placeholder="Nome do novo gênero..."
                      className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customEditGenreInput.trim()) {
                          handleAddCustomGenre(customEditGenreInput.trim());
                          setEditGenre(customEditGenreInput.trim());
                          setIsCreatingEditGenre(false);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90"
                    >
                      Criar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingEditGenre(false)}
                      className="px-2 py-1.5 rounded-xl text-xs text-[#7D6F74] hover:bg-[#FAF3EC] dark:hover:bg-[#2D2228]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Link da Indicação (TikTok, Insta, Trailer)
                </label>
                <input
                  type="url"
                  value={editLinkUrl}
                  onChange={(e) => setEditLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {/* Edit Poster upload */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2C2127] border border-[#F2E8E4] dark:border-[#3D2F36]">
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                  Imagem de Capa
                </label>

                {editPosterUrl ? (
                  <div className="relative h-28 w-20 rounded-xl overflow-hidden border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs group">
                    <img
                      src={editPosterUrl}
                      alt="Capa"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEditPosterUrl('')}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Trocar Foto
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={editPosterFileRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, setEditPosterUrl);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => editPosterFileRef.current?.click()}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#33252C] border border-[#E07A8B]/40 text-[#E07A8B] hover:bg-[#FAF3EC] text-xs font-semibold transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Subir foto do celular</span>
                    </button>
                    <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">ou link:</span>
                    <input
                      type="url"
                      value={editPosterUrl}
                      onChange={(e) => setEditPosterUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#33252C] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nossas Anotações / Por que assistir?
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
                <button
                  type="button"
                  onClick={() => {
                    const toDel = editingMovie;
                    setEditingMovie(null);
                    setMovieToDelete(toDel);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Filme</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMovie(null)}
                    className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white font-medium shadow-xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {movieToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-sm w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Remover da Lista?
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
                Deseja remover "<strong>{movieToDelete.title}</strong>" da lista de filmes do casal?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setMovieToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteMovie(movieToDelete.id);
                  setMovieToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-xs"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Genres Modal */}
      {isManagingGenresModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Gerenciar Gêneros de Filmes & Séries
                </h3>
                <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                  Edite o nome de qualquer gênero, adicione novos ou exclua o que preferir.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsManagingGenresModalOpen(false);
                  setEditingGenreOriginal(null);
                }}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Add New Genre Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customGenreInput}
                onChange={(e) => setCustomGenreInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (customGenreInput.trim()) {
                      handleAddCustomGenre(customGenreInput.trim());
                      setCustomGenreInput('');
                    }
                  }
                }}
                placeholder="Novo gênero (ex: True Crime, Anos 90)..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] placeholder-[#A6999F] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customGenreInput.trim()) {
                    handleAddCustomGenre(customGenreInput.trim());
                    setCustomGenreInput('');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {allGenres.length === 0 ? (
                <p className="text-xs text-center py-6 text-[#7D6F74] dark:text-[#B8A8AF]">
                  Nenhum gênero cadastrado.
                </p>
              ) : (
                allGenres.map((g) => {
                  const isEditingThis = editingGenreOriginal === g;
                  return (
                    <div
                      key={g}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36]"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            autoFocus
                            value={editingGenreInput}
                            onChange={(e) => setEditingGenreInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEditedGenre(g);
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditedGenre(g)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGenreOriginal(null)}
                            className="px-2 py-1.5 text-xs text-[#7D6F74] hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs sm:text-sm font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                            {g}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGenreOriginal(g);
                                setEditingGenreInput(g);
                              }}
                              className="p-1.5 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Editar nome do gênero"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGenre(g)}
                              className="p-1.5 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Excluir gênero"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
              <button
                type="button"
                onClick={() => {
                  setIsManagingGenresModalOpen(false);
                  setEditingGenreOriginal(null);
                }}
                className="w-full py-2.5 rounded-2xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
