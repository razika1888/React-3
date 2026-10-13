import './Outbreak.css'
import outbreak from '/outbreak_1.png'

function Outbreak(){
    return(
        <div className='marca-dagua'>
            <div className='outbreak-flex'>
                <img src={outbreak}></img>
                <h1>☭ Outbreak, 1987</h1>
            </div>
        </div>
    )
}

export default Outbreak