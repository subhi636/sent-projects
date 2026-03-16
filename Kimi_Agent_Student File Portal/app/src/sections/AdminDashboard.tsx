import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  Download,
  Trash2,
  Eye,
  LogOut,
  FileText,
  Archive,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  FolderOpen,
} from 'lucide-react';
import type { FileRecord, StatsResponse, ZipContent } from '@/types';

interface AdminDashboardProps {
  onLogout: () => void;
}

const subjects = [
  'Professional Ethics',
  'Artificial Intelligence',
  'Artificial Intelligence LAB',
  'Networks Programming',
  'Networks Programming LAB',
  'Modern Networks Technologies',
  'Arabic Language III',
  'Digital Signal Processing',
  'Digital Signal Processing LAB',
  'Operating Systems',
  'Operating Systems LAB',
];

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { t, language } = useApp();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [zipContents, setZipContents] = useState<ZipContent | null>(null);
  const [lastCheck, setLastCheck] = useState(new Date().toISOString());

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (subjectFilter !== 'all') params.append('subject', subjectFilter);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`http://localhost:3001/api/files?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      toast.error('Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  }, [search, subjectFilter, page]);

  const checkNewFiles = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/check-new?lastCheck=${lastCheck}`);
      if (response.ok) {
        const data = await response.json();
        if (data.newFiles > 0) {
          toast.info(`${data.newFiles} ${t('newFileNotification')}`);
          fetchFiles();
          fetchStats();
        }
      }
      setLastCheck(new Date().toISOString());
    } catch (error) {
      console.error('Failed to check new files:', error);
    }
  }, [lastCheck, fetchFiles, fetchStats, t]);

  useEffect(() => {
    fetchFiles();
    fetchStats();

    // Check for new files every 30 seconds
    const interval = setInterval(checkNewFiles, 30000);
    return () => clearInterval(interval);
  }, [fetchFiles, fetchStats, checkNewFiles]);

  const handleDelete = async (fileId: number) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      const response = await fetch(`http://localhost:3001/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('deleteSuccess'));
        fetchFiles();
        fetchStats();
      } else {
        toast.error('Failed to delete file');
      }
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handlePreview = async (file: FileRecord) => {
    setSelectedFile(file);
    setPreviewOpen(true);
    setZipContents(null);

    if (file.file_type.includes('zip') || file.original_name.endsWith('.zip')) {
      try {
        const response = await fetch(`http://localhost:3001/api/files/${file.id}/content`);
        if (response.ok) {
          const data = await response.json();
          setZipContents(data);
        }
      } catch (error) {
        toast.error('Failed to load ZIP contents');
      }
    }
  };

  const handleDownload = (fileId: number) => {
    window.open(`http://localhost:3001/api/files/${fileId}/download`, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">{t('dashboard')}</h1>
            <p className="text-slate-400">{t('appSubtitle')}</p>
          </div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse mt-4 md:mt-0">
            <Button
              onClick={() => {
                fetchFiles();
                fetchStats();
              }}
              variant="outline"
              className="btn-secondary"
            >
              <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('refresh') || 'Refresh'}
            </Button>
            <Button onClick={onLogout} variant="outline" className="btn-secondary text-red-400">
              <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('logout')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-1">{t('totalFiles')}</p>
                  <p className="stat-value">{stats.totalFiles}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-1">{t('todayFiles')}</p>
                  <p className="stat-value">{stats.todayFiles}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <FolderOpen className="w-7 h-7 text-green-500" />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-1">{t('students')}</p>
                  <p className="stat-value">{stats.uniqueStudents}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t('searchPlaceholder')}
                className="input pl-10 rtl:pr-10 rtl:pl-4"
              />
            </div>
            <Select
              value={subjectFilter}
              onValueChange={(value) => {
                setSubjectFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="input w-full md:w-64 text-left rtl:text-right">
                <SelectValue placeholder={t('filterBySubject')} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-slate-300 hover:bg-slate-700">
                  {t('allSubjects')}
                </SelectItem>
                {subjects.map((subj) => (
                  <SelectItem
                    key={subj}
                    value={subj}
                    className="text-slate-300 hover:bg-slate-700"
                  >
                    {subj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Files Table */}
        <div className="table-container">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="spinner" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">{t('noFiles')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400">{t('fileNumber')}</TableHead>
                  <TableHead className="text-slate-400">{t('studentName')}</TableHead>
                  <TableHead className="text-slate-400">{t('subject')}</TableHead>
                  <TableHead className="text-slate-400">{t('fileName')}</TableHead>
                  <TableHead className="text-slate-400">{t('fileSize')}</TableHead>
                  <TableHead className="text-slate-400">{t('uploadDate')}</TableHead>
                  <TableHead className="text-slate-400">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file, index) => (
                  <TableRow key={file.id} className="border-slate-700/50">
                    <TableCell className="text-slate-300">{(page - 1) * 20 + index + 1}</TableCell>
                    <TableCell className="text-white font-medium">{file.student_name}</TableCell>
                    <TableCell>
                      <span className="badge badge-blue">{file.subject}</span>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {file.file_type.includes('pdf') || file.original_name.endsWith('.pdf') ? (
                          <FileText className="w-4 h-4 text-red-400" />
                        ) : (
                          <Archive className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="truncate max-w-[150px]">{file.original_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400">{formatFileSize(file.file_size)}</TableCell>
                    <TableCell className="text-slate-400">{formatDate(file.uploaded_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Button
                          onClick={() => handlePreview(file)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDownload(file.id)}
                          variant="ghost"
                          size="sm"
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(file.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse mt-6">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              className="btn-secondary"
            >
              <ChevronLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </Button>
            <span className="text-slate-400">
              {page} / {totalPages}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="outline"
              className="btn-secondary"
            >
              <ChevronRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        )}

        {/* File Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="gradient-text">{t('filePreview')}</span>
                <Button
                  onClick={() => setPreviewOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            {selectedFile && (
              <div className="mt-4">
                <div className="mb-4 p-4 bg-slate-800 rounded-lg">
                  <p className="text-slate-300">
                    <span className="text-slate-500">{t('studentName')}:</span>{' '}
                    {selectedFile.student_name}
                  </p>
                  <p className="text-slate-300 mt-1">
                    <span className="text-slate-500">{t('subject')}:</span>{' '}
                    {selectedFile.subject}
                  </p>
                  <p className="text-slate-300 mt-1">
                    <span className="text-slate-500">{t('fileName')}:</span>{' '}
                    {selectedFile.original_name}
                  </p>
                </div>

                {selectedFile.file_type.includes('pdf') || selectedFile.original_name.endsWith('.pdf') ? (
                  <iframe
                    src={`http://localhost:3001/api/files/${selectedFile.id}/content`}
                    className="pdf-viewer"
                    title="PDF Preview"
                  />
                ) : zipContents ? (
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Archive className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-yellow-400" />
                      {t('zipContents')}
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {zipContents.files.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            {item.isDirectory ? (
                              <FolderOpen className="w-5 h-5 text-yellow-400" />
                            ) : (
                              <FileText className="w-5 h-5 text-blue-400" />
                            )}
                            <span className="text-slate-300">{item.name}</span>
                          </div>
                          {!item.isDirectory && (
                            <span className="text-slate-500 text-sm">
                              {formatFileSize(item.size)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-10">
                    <div className="spinner" />
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
