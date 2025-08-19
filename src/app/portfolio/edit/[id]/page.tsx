'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ProjectForm } from '@/components/portfolio/ProjectForm';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
}

export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`http://localhost:5001/api/portfolio/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
      router.push('/portfolio');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <ProjectForm mode="edit" initialData={project} />
    </div>
  );
} 