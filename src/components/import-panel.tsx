
              import React from 'react';
              import { Save, Terminal, Trash2, Info, AlertCircle, CheckCircle } from 'lucide-react';
              import { ItemCard } from './item-card';
              import { Item } from '@/types/items';

              type ImportPanelProps = {
                rawInput: string;
                onRawInputChange: (value: string) => void;
                onCheckDuplicates: () => void;
                onProceedWithDuplicates: () => void;
                onCancelDuplicates: () => void;
                onClear: () => void;
                isProcessing?: boolean;
                previewItems: Item[];
                userName: string;
                onUserNameChange: (value: string) => void;
                duplicateCheck?: {
                  hasDuplicates: boolean;
                  duplicateItems: Item[];
                  newItems: Item[];
                } | null;
              };


              export const ImportPanel: React.FC<ImportPanelProps> = ({
                rawInput,
                onRawInputChange,
                onCheckDuplicates,
                onProceedWithDuplicates,
                onCancelDuplicates,
                onClear,
                isProcessing = false,
                previewItems,
                userName,
                onUserNameChange,
                duplicateCheck,
              }) => {
                if (duplicateCheck && duplicateCheck.hasDuplicates) {
                  return (
                    <div className="">
                      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <AlertCircle className="text-amber-500" />
                          <h2 className="text-lg font-bold text-white">Duplicate Items Detected</h2>
                        </div>

                        <div className="bg-amber-900/20 rounded-lg p-4 mb-6 border border-amber-900/50">
                          <p className="text-sm text-amber-100 mb-2">
                            <span className="font-semibold">{duplicateCheck.duplicateItems.length}</span> item(s) already exist in the database.
                          </p>
                          <p className="text-xs text-amber-200">
                            These items will be flagged for manual review. You can proceed with the import, or cancel to adjust your data.
                          </p>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2 mb-6">
                          <div className="space-y-3">
                            <h3 className="text-sm uppercase tracking-wide text-green-400 font-semibold flex items-center gap-2">
                              <CheckCircle size={16} /> New Items ({duplicateCheck.newItems.length})
                            </h3>
                            <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[350px] pr-2">
                              {duplicateCheck.newItems.length > 0 ? (
                                duplicateCheck.newItems.map((item) => <ItemCard key={item.id} item={item} />)
                              ) : (
                                <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500">
                                  No new items found.
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-sm uppercase tracking-wide text-amber-400 font-semibold flex items-center gap-2">
                              <AlertCircle size={16} /> Duplicates ({duplicateCheck.duplicateItems.length})
                            </h3>
                            <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[350px] pr-2">
                              {duplicateCheck.duplicateItems.map((item) => (
                                <div key={item.id} className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-3">
                                  <ItemCard item={item} />
                                  <div className="mt-2 text-xs text-amber-200 bg-amber-900/20 rounded px-2 py-1">
                                    Marked for manual review
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between gap-3">
                          <button
                            onClick={onCancelDuplicates}
                            disabled={isProcessing}
                            className="px-4 py-2 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={onProceedWithDuplicates}
                            disabled={isProcessing}
                            className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-lg shadow-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Save size={18} /> Proceed with Import
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <Terminal className="text-orange-500" />
                      <h2 className="text-lg font-bold text-white">Import Identify Data</h2>
                    </div>

                    <div className="bg-zinc-950/50 rounded-lg p-2 mb-4 border border-zinc-800 text-sm text-zinc-400">
                      <p className="flex gap-2 items-center"> <Info  /> Paste your identify item output directly from the MUD or your doc file below. </p>
                      {/* <ul className="list-disc list-inside space-y-1 ml-2 text-zinc-500 font-mono text-xs">
                        <li>Full &apos;Identify&apos; output blocks</li>
                        <li>Multiple items at once</li>
                        <li>Stats, flags, weights, and affects</li>
                      </ul> */}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.95fr]">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label htmlFor="import-username" className="text-sm font-semibold text-zinc-200">
                            User Name
                          </label>
                          <input
                            id="import-username"
                            type="text"
                            value={userName}
                            onChange={(event) => onUserNameChange(event.target.value)}
                            placeholder="e.g. Jaela, Merchants Guild"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          />
                          <p className="text-[11px] text-zinc-500">Assigning a name gives you a way to edit this entry later & you get street cred...</p>
                        </div>

                        <textarea
                          value={rawInput}
                          onChange={(event) => onRawInputChange(event.target.value)}
                          spellCheck={false}
                          placeholder="Paste content here (e.g. 'a heavy, black flail (excellent)...')"
                          className="w-full h-64 bg-zinc-950 border border-zinc-700 rounded-lg p-4 font-mono text-xs text-zinc-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        />

                        <div className="flex justify-between items-center">
                          <button
                            onClick={onClear}
                            disabled={isProcessing}
                            className="px-4 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-900/20 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:text-zinc-500"
                          >
                            <Trash2 size={16} /> Clear Database
                          </button>

                          <button
                            onClick={onCheckDuplicates}
                            disabled={isProcessing || !rawInput.trim()}
                            className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors shadow-lg shadow-orange-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Save size={18} /> Check & Import
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm uppercase tracking-wide text-zinc-400">Preview</h3>
                          <p className="text-[11px] text-zinc-500">Review & Confirm the submitted items</p>
                        </div>

                        {previewItems.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pr-1">
                            {previewItems.map((item) => (
                              <ItemCard key={item.id} item={item} />
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs text-zinc-500">
                            Enter identify output to preview the cleaned item data before importing.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            };
          