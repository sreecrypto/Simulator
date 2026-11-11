import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Header, Footer } from './chrome.jsx';
import { SchematicWorkspace } from './schematic.jsx';
import { FSMWorkspace, MicrocontrollerWorkspace } from './labs.jsx';
import { WorkbenchDialogs } from './dialogs.jsx';
import '../fonts.css';
import '../../styles.css';
import '../workbench.css';
import '../simulation-ui.css';
import '../workspace-modes.css';
import './workbench.css';

function Workbench() {
  const [startupError, setStartupError] = useState('');

  useEffect(() => {
    // Bind the existing circuit controller after React has mounted its controls.
    import('../app.js').catch(error => {
      console.error(error);
      setStartupError('Circuit Studio could not start. Reload the page to try again.');
    });
  }, []);

  return (
    <>
      <Header />
      {startupError && <p className="startup-error" role="alert">{startupError}</p>}
      <SchematicWorkspace />
      <FSMWorkspace />
      <MicrocontrollerWorkspace />
      <Footer />
      <WorkbenchDialogs />
    </>
  );
}

createRoot(document.getElementById('root')).render(<Workbench />);
