import { useState, useEffect, useCallback } from 'react';
import { applicationsAPI } from '../services/api';

export function useApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await applicationsAPI.list();
      setApplications(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const createApplication = async (jobData) => {
    const { data } = await applicationsAPI.create(jobData);
    await fetchApplications();
    return data;
  };

  const deleteApplication = async (id) => {
    await applicationsAPI.delete(id);
    await fetchApplications();
  };

  return { applications, loading, error, createApplication, deleteApplication, refresh: fetchApplications };
}

export function useApplication(id) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplication = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data } = await applicationsAPI.get(id);
      setApplication(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const uploadResume = async (file) => {
    const { data } = await applicationsAPI.uploadResume(id, file);
    setApplication(data);
    return data;
  };

  const updateJob = async (jobParsed) => {
    const { data } = await applicationsAPI.updateJob(id, jobParsed);
    setApplication(data);
    return data;
  };

  const runAnalysis = async () => {
    const { data } = await applicationsAPI.analyze(id);
    setApplication(data);
    return data;
  };

  const updateRecommendation = async (recIndex, status) => {
    await applicationsAPI.updateRecommendation(id, recIndex, status);
    await fetchApplication();
  };

  return {
    application, loading, error,
    uploadResume, updateJob, runAnalysis, updateRecommendation,
    refresh: fetchApplication,
  };
}
