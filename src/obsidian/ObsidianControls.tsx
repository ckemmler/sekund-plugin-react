
import React, { useState } from 'react';
import "./ObsidianButton.css"

export default function ObsidianControls() {
    const [enabled, setEnabled] = useState(false);
    return (
        <div className="flex flex-col justify-center flex-start">
            <div className="flex flex-col space-y-2 flex-start">
                <button className="self-start">Button</button>
                <div onClick={() => setEnabled(!enabled)} className={`checkbox-container ${enabled ? 'is-enabled' : ''}`} ></div>
                <select className="self-start dropdown">
                    <option value="sideway">Sideway</option>
                    <option value="mixed">Mixed</option>
                    <option value="upright">Upright</option>
                </select>
            </div>
        </div>
    );
}