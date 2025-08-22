import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchMetadataThunk, setCurrentCountry } from '@/reducers/metadataReducer';
import { AppDispatch, RootState } from '@/store';

export const useCountryFromUrl = () => {
  const { countryId } = useParams<{ countryId?: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const { currentCountry, loading } = useSelector((state: RootState) => ({
    currentCountry: state.metadata.currentCountry,
    loading: state.metadata.loading,
  }));

  useEffect(() => {
    const country = countryId || 'us';

    if (country !== currentCountry && !loading) {
      dispatch(setCurrentCountry(country));
      dispatch(fetchMetadataThunk(country));
    }
  }, [countryId, currentCountry, loading, dispatch]);

  return currentCountry;
};
