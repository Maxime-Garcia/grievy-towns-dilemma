using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class LastChoice : MonoBehaviour
{
    public Canvas CanvasObject;
    
    void Start()
    {
        CanvasObject.enabled = false;
    }
 
    void Update() 
    {
        if (GameObject.FindWithTag("Player").GetComponent<PlayerController>().BossStep == 4 && !GameObject.FindWithTag("Player").GetComponent<PlayerController>().isDialoguing)
        {
            CanvasObject.enabled = true;
        }
    }

    public void Credits()
    {
        if (GameObject.FindWithTag("Player").GetComponent<PlayerController>().BossStep == 4)
        {
            Destroy(GameObject.FindWithTag("Player"));
            Destroy(GameObject.Find("Canvas"));
            Destroy(GameObject.Find("CanvasGameOver"));
            Destroy(GameObject.Find("PlayerManager"));
            Destroy(GameObject.Find("PlayerManager"));
            Destroy(GameObject.Find("dialogueManager"));
        
            Application.LoadLevel("Credits");
        }
        
    }
}
