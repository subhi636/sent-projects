import { useState, useRef } from 'react';
import { useApp } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, File, CheckCircle, AlertCircle, Send } from 'lucide-react';

interface HomePageProps {
  onNavigate: (_page: 'home' | 'admin' | 'login') => void;
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

export default function HomePage({ onNavigate }: HomePageProps) {
  // Use onNavigate to avoid unused parameter warning
  void onNavigate;
  const { t, language } = useApp();
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (selectedFile: File | null) => {
    if (!selectedFile) return;

    const isPdf = selectedFile.name.endsWith('.pdf');
    const isZip = selectedFile.name.endsWith('.zip');

    if (!isPdf && !isZip) {
      toast.error(t('invalidFile'));
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error(t('fileTooLarge'));
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim() || !subject || !file) {
      toast.error(t('requiredFields'));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('studentName', studentName);
    formData.append('subject', subject);
    formData.append('file', file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.replaced ? t('fileReplaced') : t('uploadSuccess'));
        // Reset form
        setStudentName('');
        setSubject('');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error(data.error || t('uploadError'));
      }
    } catch (error) {
      toast.error(t('uploadError'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 mb-8 shadow-lg shadow-blue-500/25">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">{t('sendFile')}</span>
            </h1>
            <p className="text-xl text-slate-400 mb-12">
              {t('sendFileSubtitle')}
            </p>
          </div>

          {/* Upload Form */}
          <div className="animate-fadeInUp stagger-1">
            <div className="card max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Name */}
                <div className="text-left rtl:text-right">
                  <Label htmlFor="studentName" className="text-slate-300 mb-2 block">
                    {t('studentName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="studentName"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder={t('studentNamePlaceholder')}
                    className="input"
                    disabled={isUploading}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                {/* Subject */}
                <div className="text-left rtl:text-right">
                  <Label htmlFor="subject" className="text-slate-300 mb-2 block">
                    {t('subject')} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={subject} onValueChange={setSubject} disabled={isUploading}>
                    <SelectTrigger className="input text-left rtl:text-right">
                      <SelectValue placeholder={t('selectSubject')} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-80">
                      {subjects.map((subj) => (
                        <SelectItem
                          key={subj}
                          value={subj}
                          className="text-slate-300 hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                        >
                          {subj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div className="text-left rtl:text-right">
                  <Label className="text-slate-300 mb-2 block">
                    {t('file')} <span className="text-red-500">*</span>
                  </Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.zip"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {file ? (
                      <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
                        <File className="w-8 h-8 text-blue-500" />
                        <div className="text-left rtl:text-right">
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-slate-400 text-sm">{formatFileSize(file.size)}</p>
                        </div>
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
                          <Upload className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{t('dragDrop')}</p>
                          <p className="text-slate-500 text-sm mt-1">{t('maxSize')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-slate-400 text-sm">{uploadProgress}%</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isUploading || !studentName || !subject || !file}
                  className="w-full btn-primary h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <span className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div className="spinner w-5 h-5" />
                      <span>{t('uploading')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Send className="w-5 h-5" />
                      <span>{t('upload')}</span>
                    </span>
                  )}
                </Button>

                {/* Replace Info */}
                <p className="text-slate-500 text-sm flex items-start space-x-2 rtl:space-x-reverse">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{t('replaceInfo')}</span>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}