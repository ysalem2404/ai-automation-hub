import React, { useState, useMemo } from 'react';
import { Upload, Download, Search, X, CheckCircle, Plus, Trash2, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';

const App = () => {
  const [masterFile, setMasterFile] = useState(null);
  const [masterData, setMasterData] = useState([]);
  const [masterKeyField, setMasterKeyField] = useState('');
  const [sources, setSources] = useState([{ id: 1, file: null, data: [], keyField: '', fieldsToMap: [] }]);
  const [matches, setMatches] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmedMatches, setConfirmedMatches] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState(null);
  const [skipConfirmed, setSkipConfirmed] = useState(true);
  const [showConfig, setShowConfig] = useState(true);
  const [previousMasterFile, setPreviousMasterFile] = useState(null);
  const [previousMasterData, setPreviousMasterData] = useState([]);
  const [showMerge, setShowMerge] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const calculateScore = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const s1 = str1.toString().toUpperCase();
    const s2 = str2.toString().toUpperCase();
    
    const tokens1 = new Set(s1.split(/\s+/));
    const tokens2 = new Set(s2.split(/\s+/));
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return (intersection.size / union.size) * 100;
  };

  const readExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleMasterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setMasterFile(file);
    const data = await readExcelFile(file);
    setMasterData(data);
    
    if (data.length > 0) {
      const cols = Object.keys(data[0]);
      setMasterKeyField(cols[0]);
    }
  };

  const handleSourceUpload = async (e, sourceId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const data = await readExcelFile(file);
    
    setSources(prev => prev.map(s => {
      if (s.id === sourceId) {
        const cols = data.length > 0 ? Object.keys(data[0]) : [];
        return { ...s, file, data, keyField: cols[0] || '', fieldsToMap: [] };
      }
      return s;
    }));
  };

  const addSource = () => {
    const newId = Math.max(...sources.map(s => s.id), 0) + 1;
    setSources([...sources, { id: newId, file: null, data: [], keyField: '', fieldsToMap: [] }]);
  };

  const removeSource = (sourceId) => {
    setSources(sources.filter(s => s.id !== sourceId));
  };

  const updateSourceKeyField = (sourceId, field) => {
    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, keyField: field } : s));
  };

  const toggleFieldMapping = (sourceId, field) => {
    setSources(prev => prev.map(s => {
      if (s.id === sourceId) {
        const fieldsToMap = s.fieldsToMap.includes(field)
          ? s.fieldsToMap.filter(f => f !== field)
          : [...s.fieldsToMap, field];
        return { ...s, fieldsToMap };
      }
      return s;
    }));
  };

  const processMatching = async () => {
    if (!masterData.length) {
      alert('Please upload Master file');
      return;
    }
    
    const activeSources = sources.filter(s => s.data.length > 0 && s.keyField && s.fieldsToMap.length > 0);
    if (activeSources.length === 0) {
      alert('Please configure at least one source');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setFilterStatus(null);
    const results = [];

    const allSourceData = activeSources.flatMap(source => 
      source.data.map(row => ({
        sourceId: source.id,
        keyValue: row[source.keyField],
        data: row
      }))
    );

    for (let i = 0; i < masterData.length; i++) {
      const masterRow = masterData[i];
      const masterKeyValue = masterRow[masterKeyField];
      
      if (skipConfirmed && confirmedMatches.has(masterKeyValue)) {
        const existingMatch = matches.find(m => m.masterKeyValue === masterKeyValue);
        if (existingMatch) {
          results.push(existingMatch);
          setProgress(((i + 1) / masterData.length) * 100);
          continue;
        }
      }
      
      const scores = allSourceData.map(sourceRow => ({
        sourceRow,
        score: calculateScore(masterKeyValue, sourceRow.keyValue)
      }));

      scores.sort((a, b) => b.score - a.score);
      const top3 = scores.slice(0, 3);

      results.push({
        masterRow,
        masterKeyValue,
        bestMatch: top3[0],
        match2: top3[1],
        match3: top3[2],
        status: top3[0].score >= 80 ? 'auto' : top3[0].score >= 60 ? 'review' : 'nomatch',
        confirmed: confirmedMatches.has(masterKeyValue)
      });

      setProgress(((i + 1) / masterData.length) * 100);
      
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    setMatches(results);
    setProcessing(false);
    setShowConfig(false);
  };

  const toggleConfirmMatch = (index) => {
    const match = matches[index];
    const newConfirmed = new Set(confirmedMatches);
    
    if (newConfirmed.has(match.masterKeyValue)) {
      newConfirmed.delete(match.masterKeyValue);
    } else {
      newConfirmed.add(match.masterKeyValue);
    }
    
    setConfirmedMatches(newConfirmed);
    setMatches(prev => prev.map((m, i) => 
      i === index ? { ...m, confirmed: newConfirmed.has(m.masterKeyValue) } : m
    ));
  };

  const selectAlternativeMatch = (index, altMatch) => {
    const match = matches[index];
    const newConfirmed = new Set(confirmedMatches);
    newConfirmed.add(match.masterKeyValue);
    setConfirmedMatches(newConfirmed);
    
    setMatches(prev => prev.map((m, i) => {
      if (i === index) {
        return { ...m, bestMatch: altMatch, confirmed: true };
      }
      return m;
    }));
  };

  const filteredMatches = useMemo(() => {
    if (!filterStatus) return matches;
    if (filterStatus === 'confirmed') return matches.filter(m => m.confirmed);
    return matches.filter(m => !m.confirmed && m.status === filterStatus);
  }, [matches, filterStatus]);

  const stats = useMemo(() => {
    if (!matches.length) return null;
    
    const auto = matches.filter(m => m.status === 'auto' && !m.confirmed).length;
    const review = matches.filter(m => m.status === 'review' && !m.confirmed).length;
    const nomatch = matches.filter(m => m.status === 'nomatch' && !m.confirmed).length;
    const confirmed = confirmedMatches.size;
    
    return { auto, review, nomatch, confirmed, total: matches.length };
  }, [matches, confirmedMatches]);

  const exportResults = () => {
    if (!matches.length) return;

    const activeSources = sources.filter(s => s.data.length > 0 && s.fieldsToMap.length > 0);
    
    const mappingData = matches.map((match) => {
      const matchedSource = match.bestMatch.sourceRow;
      
      const result = {
        'Master Key': match.masterKeyValue,
        'Best Match': match.bestMatch.sourceRow.keyValue,
        'Confidence': Math.round(match.bestMatch.score),
        'Status': match.status,
        'Confirmed': match.confirmed ? 'Yes' : 'No'
      };
      
      activeSources.forEach(source => {
        if (matchedSource.sourceId === source.id) {
          source.fieldsToMap.forEach(field => {
            result[field] = matchedSource.data[field] || '';
          });
        }
      });
      
      return result;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(mappingData);
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'Mapping_Results.xlsx');
  };

  const exportUpdatedMaster = () => {
    if (!matches.length) return;

    const activeSources = sources.filter(s => s.data.length > 0 && s.fieldsToMap.length > 0);

    const updatedMaster = matches.map((match) => {
      const matchedSource = match.bestMatch.sourceRow;
      
      const result = {
        ...match.masterRow,
        'MatchConfidence': Math.round(match.bestMatch.score),
        'Confirmed': match.confirmed ? 'Yes' : 'No'
      };
      
      activeSources.forEach(source => {
        if (matchedSource.sourceId === source.id) {
          source.fieldsToMap.forEach(field => {
            result[field + '_Updated'] = matchedSource.data[field] || '';
          });
        }
      });
      
      return result;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(updatedMaster);
    XLSX.utils.book_append_sheet(wb, ws, 'Updated Master');
    XLSX.writeFile(wb, 'Updated_Master.xlsx');
  };

  const handlePreviousMasterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setPreviousMasterFile(file);
    const data = await readExcelFile(file);
    setPreviousMasterData(data);
  };

  const mergeMasters = () => {
    if (!previousMasterData.length || !matches.length) {
      alert('Please upload previous master and run matching first');
      return;
    }

    const activeSources = sources.filter(s => s.data.length > 0 && s.fieldsToMap.length > 0);
    
    const updatedDataMap = new Map();
    matches.forEach((match) => {
      const matchedSource = match.bestMatch.sourceRow;
      const updatedFields = {};
      
      activeSources.forEach(source => {
        if (matchedSource.sourceId === source.id) {
          source.fieldsToMap.forEach(field => {
            updatedFields[field] = matchedSource.data[field] || '';
          });
        }
      });
      
      updatedDataMap.set(match.masterKeyValue, {
        ...updatedFields,
        MatchConfidence: Math.round(match.bestMatch.score),
        Confirmed: match.confirmed ? 'Yes' : 'No',
        LastUpdated: new Date().toISOString().split('T')[0]
      });
    });

    const mergedData = previousMasterData.map(oldRow => {
      const keyValue = oldRow[masterKeyField];
      const updatedData = updatedDataMap.get(keyValue);
      
      if (updatedData) {
        return {
          ...oldRow,
          ...updatedData,
          UpdateStatus: 'Updated'
        };
      } else {
        return {
          ...oldRow,
          UpdateStatus: 'Not Updated',
          LastUpdated: ''
        };
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(mergedData);
    XLSX.utils.book_append_sheet(wb, ws, 'Merged Master');
    XLSX.writeFile(wb, 'Merged_Master.xlsx');
    
    alert(`Merged ${mergedData.length} rows! ${updatedDataMap.size} updated, ${mergedData.length - updatedDataMap.size} kept original.`);
  };

  const startNewJob = () => {
    if (matches.length > 0) {
      setShowResetConfirm(true);
    } else {
      performReset();
    }
  };

  const performReset = () => {
    setMasterFile(null);
    setMasterData([]);
    setMasterKeyField('');
    setSources([{ id: 1, file: null, data: [], keyField: '', fieldsToMap: [] }]);
    setMatches([]);
    setProcessing(false);
    setProgress(0);
    setConfirmedMatches(new Set());
    setFilterStatus(null);
    setSkipConfirmed(true);
    setShowConfig(true);
    setPreviousMasterFile(null);
    setPreviousMasterData([]);
    setShowMerge(false);
    setShowResetConfirm(false);
  };

  const masterColumns = masterData.length > 0 ? Object.keys(masterData[0]) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Start New Match Job?</h3>
              <p className="text-gray-600 mb-6">This will clear all current matches and confirmations. Are you sure?</p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={performReset}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Generic Data Matcher</h1>
            <p className="text-gray-600">Match and map data from multiple sources</p>
          </div>
          <div className="flex gap-2">
            {matches.length > 0 && (
              <>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
                >
                  <Settings className="w-5 h-5" />
                  {showConfig ? 'Hide' : 'Show'} Config
                </button>
                <button
                  onClick={startNewJob}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-all"
                  type="button"
                >
                  <Plus className="w-5 h-5" />
                  New Match Job
                </button>
              </>
            )}
          </div>
        </div>

        {showConfig && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Master File ({masterData.length} rows)</h2>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleMasterUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
              />
              {masterFile && <p className="text-sm text-green-600 mb-4">✓ {masterFile.name}</p>}
              
              {masterData.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Field:</label>
                  <select
                    value={masterKeyField}
                    onChange={(e) => setMasterKeyField(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {masterColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Source Files</h2>
                <button
                  onClick={addSource}
                  disabled={sources.length >= 5}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  <Plus className="w-4 h-4" />
                  Add Source
                </button>
              </div>

              {sources.map((source, idx) => {
                const sourceColumns = source.data.length > 0 ? Object.keys(source.data[0]) : [];
                
                return (
                  <div key={source.id} className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Source {idx + 1} ({source.data.length} rows)</h3>
                      {sources.length > 1 && (
                        <button onClick={() => removeSource(source.id)} className="text-red-600">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleSourceUpload(e, source.id)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 mb-3"
                    />
                    {source.file && <p className="text-sm text-green-600 mb-3">✓ {source.file.name}</p>}

                    {source.data.length > 0 && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Key Field:</label>
                          <select
                            value={source.keyField}
                            onChange={(e) => updateSourceKeyField(source.id, e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            {sourceColumns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fields to Map:</label>
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                            {sourceColumns.filter(col => col !== source.keyField).map(col => (
                              <label key={col} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={source.fieldsToMap.includes(col)}
                                  onChange={() => toggleFieldMapping(source.id, col)}
                                  className="rounded"
                                />
                                {col}
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Selected: {source.fieldsToMap.length}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center my-8">
          <button
            onClick={processMatching}
            disabled={processing || !masterData.length}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2 mx-auto"
          >
            <Search className="w-5 h-5" />
            {processing ? `Processing ${Math.round(progress)}%` : matches.length > 0 ? 'Re-run' : 'Start Matching'}
          </button>
          {matches.length > 0 && (
            <div className="mt-4">
              <label className="flex items-center gap-2 justify-center">
                <input
                  type="checkbox"
                  checked={skipConfirmed}
                  onChange={(e) => setSkipConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Skip confirmed ({confirmedMatches.size})</span>
              </label>
            </div>
          )}
        </div>

        {processing && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-indigo-600 h-4 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-8">
            <button
              onClick={() => setFilterStatus(null)}
              className={`rounded-lg shadow p-4 text-center ${filterStatus === null ? 'bg-white ring-2 ring-indigo-500' : 'bg-white hover:bg-gray-50'}`}
            >
              <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </button>
            <button
              onClick={() => setFilterStatus('auto')}
              className={`rounded-lg shadow p-4 text-center ${filterStatus === 'auto' ? 'bg-green-100 ring-2 ring-green-500' : 'bg-green-50 hover:bg-green-100'}`}
            >
              <div className="text-3xl font-bold text-green-600">{stats.auto}</div>
              <div className="text-sm text-gray-600">Auto</div>
            </button>
            <button
              onClick={() => setFilterStatus('review')}
              className={`rounded-lg shadow p-4 text-center ${filterStatus === 'review' ? 'bg-yellow-100 ring-2 ring-yellow-500' : 'bg-yellow-50 hover:bg-yellow-100'}`}
            >
              <div className="text-3xl font-bold text-yellow-600">{stats.review}</div>
              <div className="text-sm text-gray-600">Review</div>
            </button>
            <button
              onClick={() => setFilterStatus('nomatch')}
              className={`rounded-lg shadow p-4 text-center ${filterStatus === 'nomatch' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-red-50 hover:bg-red-100'}`}
            >
              <div className="text-3xl font-bold text-red-600">{stats.nomatch}</div>
              <div className="text-sm text-gray-600">No Match</div>
            </button>
            <button
              onClick={() => setFilterStatus('confirmed')}
              className={`rounded-lg shadow p-4 text-center ${filterStatus === 'confirmed' ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-purple-50 hover:bg-purple-100'}`}
            >
              <div className="text-3xl font-bold text-purple-600">{stats.confirmed}</div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </button>
          </div>
        )}

        {matches.length > 0 && (
          <div className="mb-8">
            {filterStatus && (
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-full text-sm">
                  Showing {filteredMatches.length} of {stats.total}
                  <button onClick={() => setFilterStatus(null)} className="hover:bg-indigo-200 rounded-full p-1">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              </div>
            )}
            
            <div className="flex gap-4 justify-center mb-4">
              <button onClick={exportResults} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Mapping
              </button>
              <button onClick={exportUpdatedMaster} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Master
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <button
                onClick={() => setShowMerge(!showMerge)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className="text-lg font-semibold text-gray-800">Merge with Previous Master</h3>
                <span className="text-sm text-gray-500">{showMerge ? 'Hide' : 'Show'}</span>
              </button>
              
              {showMerge && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>What does Merge do?</strong>
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                      <li>Keeps ALL rows from your previous master file</li>
                      <li>Updates rows that have new matches with fresh data from sources</li>
                      <li>Adds UpdateStatus column (Updated / Not Updated)</li>
                      <li>Preserves all original columns from previous master</li>
                      <li>Perfect for incremental updates!</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Previous Master File:
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handlePreviousMasterUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                    {previousMasterFile && (
                      <p className="text-sm text-green-600 mt-2">✓ {previousMasterFile.name} ({previousMasterData.length} rows)</p>
                    )}
                  </div>

                  <button
                    onClick={mergeMasters}
                    disabled={!previousMasterData.length}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Merge & Export
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {matches.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">CONFIRM</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">MASTER</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">MATCH</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">SCORE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">ALTERNATIVES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => {
                    const idx = matches.findIndex(m => m.masterKeyValue === match.masterKeyValue);
                    const bg = match.confirmed ? 'bg-purple-50' : match.status === 'auto' ? 'bg-green-50' : match.status === 'review' ? 'bg-yellow-50' : 'bg-red-50';
                    
                    return (
                      <tr key={idx} className={`border-b ${bg}`}>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleConfirmMatch(idx)}
                            className={`p-2 rounded-full ${match.confirmed ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">{match.masterKeyValue}</td>
                        <td className="px-4 py-3 text-sm">
                          <div>{match.bestMatch.sourceRow.keyValue}</div>
                          <div className="text-xs text-gray-500">Source {match.bestMatch.sourceRow.sourceId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${match.bestMatch.score >= 80 ? 'bg-green-200' : match.bestMatch.score >= 60 ? 'bg-yellow-200' : 'bg-red-200'}`}>
                            {Math.round(match.bestMatch.score)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {match.match2 && (
                            <button onClick={() => selectAlternativeMatch(idx, match.match2)} className="text-blue-600 hover:underline block">
                              {match.match2.sourceRow.keyValue} ({Math.round(match.match2.score)}%)
                            </button>
                          )}
                          {match.match3 && (
                            <button onClick={() => selectAlternativeMatch(idx, match.match3)} className="text-blue-600 hover:underline block">
                              {match.match3.sourceRow.keyValue} ({Math.round(match.match3.score)}%)
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
