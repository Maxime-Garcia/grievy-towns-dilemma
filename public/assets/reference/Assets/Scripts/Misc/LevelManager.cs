using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class LevelManager : MonoBehaviour
{

	public GameObject PauseWindow;
	
	private bool _paused = false;
	
	// Update is called once per frame
	void Update () {

		if (Input.GetKey(KeyCode.Escape) && SceneManager.GetActiveScene().name != "Menu")
		{
			_paused = !_paused;
		}
		
		if (_paused)
		{
			Time.timeScale = 0;
			PauseWindow.SetActive(true);
		}
	}

	public void changeScene(string name) {
		Application.LoadLevel(name);
	}

	public void Resume()
	{
		_paused = false;
		Time.timeScale = 1;
		PauseWindow.SetActive(false);
	}
	
	public void Quit()
	{
		Application.Quit();
	}
}
