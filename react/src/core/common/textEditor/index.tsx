import React, { useState, useEffect } from 'react';
import DefaultEditor from "react-simple-wysiwyg";

interface CommonTextEditorProps {
    defaultValue?: string; // Optional prop for the default value
    onChange?: (value: string) => void; // Optional callback for value changes
}

const CommonTextEditor: React.FC<CommonTextEditorProps> = ({ defaultValue, onChange }) => {
    const [value, setValue] = useState(defaultValue || ""); // Use defaultValue as the initial value

    const handleChange = (e: any) => {
        const newValue = e.target.value;
        setValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    // Update value when defaultValue changes
    useEffect(() => {
        setValue(defaultValue || "");
    }, [defaultValue]);

    return (
        <>
            <DefaultEditor value={value} onChange={handleChange} />
        </>
    );
}

export default CommonTextEditor;
